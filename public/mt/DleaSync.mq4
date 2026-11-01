//+------------------------------------------------------------------+
//|                                                  DleaSync.mq4    |
//|              Dlea AI - MetaTrader 4 trade sync expert            |
//+------------------------------------------------------------------+
#property copyright "Dlea AI"
#property version   "1.00"
#property strict
#property description "Syncs closed trades from MetaTrader 4 to Dlea AI"

//--- inputs ----------------------------------------------------------
input string InpWebhookUrl   = "http://127.0.0.1:8000/api/trades/webhook/"; // Dlea webhook URL
input string InpToken        = "YOUR_TOKEN_HERE";                          // Webhook token (from settings)
input bool   InpSyncHistory  = true;                                       // Import existing closed trades on start
input int    InpBackfillDays = 0;                                          // Backfill window in days (0 = everything MT has)
input bool   InpDebugLog     = true;                                       // Print sent trades to log

//--- tickets already pushed in this session --------------------------
// MT4 has no deal/position model: one closed ORDER *is* the trade, and
// the terminal re-reports the same finished order on every scan, so the
// list is what stops us from posting it again every few seconds.
#define MAX_SENT 2000

int      g_sentTickets[MAX_SENT];
int      g_sentCount = 0;
datetime g_from      = 0; // ignore trades closed before this moment
datetime g_lastScan  = 0;

//+------------------------------------------------------------------+
//| Fill an output array slot only when the level looks real.        |
//+------------------------------------------------------------------+
bool ParseLevelFromComment(const string comment, const string tag, double &level)
{
   string needle = "[" + tag + " ";
   int at = StringFind(comment, needle);
   if(at < 0) return false;
   int from = at + StringLen(needle);
   int to   = StringFind(comment, "]", from);
   if(to < 0) return false;
   string raw = StringSubstr(comment, from, to - from);
   StringTrimLeft(raw);
   StringTrimRight(raw);
   double value = StringToDouble(raw);
   if(value <= 0) return false;
   level = value;
   return true;
}

//+------------------------------------------------------------------+
//| Has this order already been pushed during this session?          |
//+------------------------------------------------------------------+
bool AlreadySent(const int ticket)
{
   for(int i = 0; i < g_sentCount; i++)
      if(g_sentTickets[i] == ticket)
         return true;
   return false;
}

//+------------------------------------------------------------------+
//| Remember a ticket. The list is capped so a chart left running for |
//| weeks does not grow without bound; the oldest half is dropped and |
//| the server's own ticket de-duplication covers anything forgotten. |
//+------------------------------------------------------------------+
void MarkSent(const int ticket)
{
   if(AlreadySent(ticket)) return;
   if(g_sentCount >= MAX_SENT)
   {
      int half = MAX_SENT / 2;
      for(int i = 0; i < half; i++)
         g_sentTickets[i] = g_sentTickets[i + half];
      g_sentCount = half;
   }
   g_sentTickets[g_sentCount] = ticket;
   g_sentCount++;
}

//+------------------------------------------------------------------+
//| Expert initialization                                            |
//+------------------------------------------------------------------+
int OnInit()
{
   if(StringLen(InpWebhookUrl) < 10)
   {
      Print("DleaSync ERROR: webhook URL is empty. Paste it from Dlea settings > MetaTrader.");
      return(INIT_PARAMETERS_INCORRECT);
   }
   if(StringFind(InpToken, "YOUR_TOKEN") >= 0 || StringLen(InpToken) < 10)
   {
      Print("DleaSync ERROR: token is not set. Paste it from Dlea settings > MetaTrader.");
      return(INIT_PARAMETERS_INCORRECT);
   }

   //--- Which closed orders are in scope.
   if(!InpSyncHistory)
      g_from = TimeCurrent();                       // only trades closed from now on
   else if(InpBackfillDays > 0)
      g_from = TimeCurrent() - (datetime)InpBackfillDays * 86400;
   else
      g_from = 0;                                   // everything the terminal has

   //--- MT4 does not emit a "trade closed" event the way MT5 does, so the
   //--- history is polled. A timer runs between ticks (and on a quiet
   //--- chart, so a close is not left unsent until the next tick).
   EventSetTimer(5);

   Print("DleaSync v1.00 (MT4) started. Waiting for closed trades...");

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Escape a string so it is safe to embed inside a JSON string      |
//+------------------------------------------------------------------+
string JsonEscape(const string s)
{
   string out = "";
   int len = StringLen(s);
   for(int i = 0; i < len; i++)
   {
      ushort c = StringGetCharacter(s, i);
      if(c == 34)       out += "\\\"";
      else if(c == 92)  out += "\\\\";
      else if(c == 10)  out += "\\n";
      else if(c == 13)  out += "\\r";
      else if(c == 9)   out += "\\t";
      else              out += ShortToString(c);
   }
   return out;
}

//+------------------------------------------------------------------+
//| Send the payload with WebRequest (with retries)                  |
//+------------------------------------------------------------------+
bool SendToDlea(const string payload, const int ticket)
{
   string headers = "Content-Type: application/json\r\n";
   char   data[];
   char   result[];
   string resultHeaders;
   int    timeout = 10000;

   // StringToCharArray appends a trailing '\0'; strip it or the server's
   // JSON parser rejects the body with "invalid data".
   StringToCharArray(payload, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(ArraySize(data) > 0) ArrayResize(data, ArraySize(data) - 1);

   int attempts = 3;
   for(int i = 1; i <= attempts; i++)
   {
      ResetLastError();
      int status = WebRequest("POST", InpWebhookUrl, headers, timeout, data, result, resultHeaders);

      if(status == 200 || status == 201)
      {
         if(InpDebugLog) Print("DleaSync: trade #", ticket, " synced OK.");
         return true;
      }

      if(InpDebugLog) Print("DleaSync: attempt ", i, " failed (HTTP ", status, ", err ", GetLastError(), ")");
      if(InpDebugLog && ArraySize(result) > 0)
         Print("DleaSync: server said: ", CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8));
      Sleep(2000);
   }
   if(InpDebugLog) Print("DleaSync: giving up on trade #", ticket, " after ", attempts, " attempts.");
   return false;
}

//+------------------------------------------------------------------+
//| Build the payload for one closed order and send it to Dlea       |
//+------------------------------------------------------------------+
bool SendTrade(const int ticket)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET, MODE_HISTORY))
   {
      if(InpDebugLog) Print("DleaSync: order #", ticket, " is not in history.");
      return false;
   }

   //--- everything is read now: OrderSelect() is the only cursor MT4 has,
   //--- and the next call moves it.
   int      type       = OrderType();
   string   symbol     = OrderSymbol();
   double   volume     = OrderLots();
   double   entryPrice = OrderOpenPrice();
   double   exitPrice  = OrderClosePrice();
   double   sl         = OrderStopLoss();
   double   tp         = OrderTakeProfit();
   double   profit     = OrderProfit();
   double   commission = OrderCommission();
   double   swap       = OrderSwap();
   datetime openT      = OrderOpenTime();
   datetime closeT     = OrderCloseTime();
   int      magic      = OrderMagicNumber();
   string   comment    = OrderComment();

   //--- MT4 keeps the stop levels on the closed order, so this is only a
   //--- fallback for brokers that blank them when a position is stopped out.
   if(sl <= 0 && ParseLevelFromComment(comment, "sl", sl) && InpDebugLog)
      Print("DleaSync: SL recovered from order comment for #", ticket, " -> ", DoubleToString(sl, 5));
   if(tp <= 0 && ParseLevelFromComment(comment, "tp", tp) && InpDebugLog)
      Print("DleaSync: TP recovered from order comment for #", ticket, " -> ", DoubleToString(tp, 5));

   //--- R:R = how far price actually travelled / how much was risked.
   //--- Without a stop the ratio does not exist, so 0 is the honest value.
   double rr = 0.0;
   if(sl > 0)
   {
      double risk = MathAbs(entryPrice - sl);
      if(risk > 0)
         rr = MathAbs(exitPrice - entryPrice) / risk;
   }

   string sideStr = (type == OP_BUY) ? "buy" : "sell";

   if(InpDebugLog)
      Print("DleaSync: trade #", ticket, " ", symbol, " ", sideStr,
            " SL=", DoubleToString(sl, 5), " TP=", DoubleToString(tp, 5),
            " pnl=", DoubleToString(profit, 2));

   //--- Same contract as the MT5 expert, so both platforms land in the
   //--- very same endpoint and serializer.
   string payload = StringFormat(
      "{\"token\":\"%s\",\"trades\":[{\"ticket\":\"%d\",\"symbol\":\"%s\",\"side\":\"%s\","
      "\"entry\":%s,\"exit\":%s,\"sl\":%s,\"tp\":%s,\"volume\":%s,\"pnl\":%s,\"commission\":%s,"
      "\"swap\":%s,\"rr\":%s,\"open_time\":\"%s\",\"close_time\":\"%s\","
      "\"magic\":%d,\"comment\":\"%s\",\"reason\":\"EA\",\"followedPlan\":true}]}",
      InpToken,
      ticket,
      JsonEscape(symbol),
      sideStr,
      DoubleToString(entryPrice, 5),
      DoubleToString(exitPrice, 5),
      DoubleToString(sl, 5),
      DoubleToString(tp, 5),
      DoubleToString(volume, 2),
      DoubleToString(profit, 2),
      DoubleToString(commission, 2),
      DoubleToString(swap, 2),
      DoubleToString(rr, 2),
      TimeToString(openT, TIME_DATE|TIME_MINUTES),
      TimeToString(closeT, TIME_DATE|TIME_MINUTES),
      magic,
      JsonEscape(comment)
   );

   return SendToDlea(payload, ticket);
}

//+------------------------------------------------------------------+
//| Look for orders that closed since the last pass                  |
//+------------------------------------------------------------------+
void ScanClosed()
{
   g_lastScan = TimeCurrent();

   int total = OrdersHistoryTotal();
   if(total <= 0) return;

   for(int i = 0; i < total; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;

      int      ticket = OrderTicket();
      datetime closeT = OrderCloseTime();
      if(closeT <= 0) continue;                    // still open
      if(g_from > 0 && closeT < g_from) continue;  // outside the window
      if(AlreadySent(ticket)) continue;

      //--- Marked before sending on purpose: SendToDlea already retries,
      //--- and re-posting a trade the server rejected would loop forever.
      MarkSent(ticket);
      SendTrade(ticket);
   }
}

//+------------------------------------------------------------------+
//| Poll on every tick (throttled) so a close is picked up at once   |
//+------------------------------------------------------------------+
void OnTick()
{
   if(TimeCurrent() - g_lastScan < 2) return;
   ScanClosed();
}

//+------------------------------------------------------------------+
//| Poll on the timer too: a chart can go tickless right when a       |
//| position closes (weekend, dead symbol), and a tick-only EA would  |
//| leave that trade unsent until the market wakes up.                |
//+------------------------------------------------------------------+
void OnTimer()
{
   ScanClosed();
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("DleaSync (MT4) stopped.");
}
