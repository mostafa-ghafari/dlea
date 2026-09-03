//+------------------------------------------------------------------+
//|                                                  DleaSync.mq5    |
//|              Dlea AI - MetaTrader 5 trade sync expert            |
//+------------------------------------------------------------------+
#property copyright "Dlea AI"
#property version   "1.03"
#property strict
#property description "Syncs closed trades from MetaTrader 5 to Dlea AI"

//--- inputs ----------------------------------------------------------
input string InpWebhookUrl  = "http://127.0.0.1:8000/api/trades/webhook/"; // Dlea webhook URL
input string InpToken       = "YOUR_TOKEN_HERE";                          // Webhook token (from settings)
input bool   InpSyncHistory = true;                                       // Import existing closed trades on start
input bool   InpDebugLog    = true;                                       // Print sent deals to log

ulong g_lastDeal = 0; // dedupe: last deal ticket we already sent

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

   Print("DleaSync started. Waiting for closed trades...");

   // Backfill: import trades that closed before the EA was attached.
   if(InpSyncHistory)
      SyncHistory();

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Import every already-closed position from history (backfill)     |
//+------------------------------------------------------------------+
void SyncHistory()
{
   if(!HistorySelect(0, TimeCurrent()))
   {
      Print("DleaSync: could not load history.");
      return;
   }

   int total = HistoryDealsTotal();
   if(InpDebugLog) Print("DleaSync: scanning ", total, " history deals...");

   int sent = 0;
   for(int i = 0; i < total; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0) continue;

      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT) continue;

      if(SendDeal(dealTicket)) sent++;
   }

   if(InpDebugLog) Print("DleaSync: backfill done, sent ", sent, " closed deals.");
}

//+------------------------------------------------------------------+
//| Track every new deal and push closed ones to Dlea                |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD) return;
   if(trans.deal == 0) return;

   ulong dealTicket = trans.deal;
   if(dealTicket == g_lastDeal) return; // already handled

   if(!HistorySelect(0, TimeCurrent())) return;

   ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
   if(entry != DEAL_ENTRY_OUT) return;

   g_lastDeal = dealTicket;
   SendDeal(dealTicket);
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
      if(c == 34)       out += "\\\"";      // double quote
      else if(c == 92)  out += "\\\\";      // backslash
      else if(c == 10)  out += "\\n";       // newline
      else if(c == 13)  out += "\\r";       // carriage return
      else if(c == 9)   out += "\\t";       // tab
      else              out += ShortToString(c);
   }
   return out;
}

//+------------------------------------------------------------------+
//| Read SL/TP from the position's open order                         |
//+------------------------------------------------------------------+
void GetPositionSLTP(const ulong position, double &sl, double &tp)
{
   sl = 0.0;
   tp = 0.0;
   if(!HistorySelect(0, TimeCurrent())) return;

   // Find the OPEN (entry IN) deal of this position
   for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
   {
      ulong dealT = HistoryDealGetTicket(i);
      if(dealT == 0) continue;
      if(HistoryDealGetInteger(dealT, DEAL_POSITION_ID) != position) continue;
      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealT, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_IN) continue;

      // The position ticket from the opening deal
      ulong posTicket = (ulong)HistoryDealGetInteger(dealT, DEAL_POSITION_ID);

      // Search orders for the position open order
      for(int j = HistoryOrdersTotal() - 1; j >= 0; j--)
      {
         ulong ordT = HistoryOrderGetTicket(j);
         if(ordT == 0) continue;
         if(HistoryOrderGetInteger(ordT, ORDER_POSITION_ID) != (long)posTicket) continue;
         ENUM_ORDER_TYPE ordType = (ENUM_ORDER_TYPE)HistoryOrderGetInteger(ordT, ORDER_TYPE);
         if(ordType == ORDER_TYPE_BUY || ordType == ORDER_TYPE_SELL)
         {
            sl = HistoryOrderGetDouble(ordT, ORDER_SL);
            tp = HistoryOrderGetDouble(ordT, ORDER_TP);
            return;
         }
      }
      break;
   }
}

//+------------------------------------------------------------------+
//| Build the payload for one closed deal and send it to Dlea        |
//+------------------------------------------------------------------+
bool SendDeal(const ulong dealTicket)
{
   //--- gather deal fields
   long   type      = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
   long   magic     = HistoryDealGetInteger(dealTicket, DEAL_MAGIC);
   long   position  = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
   string symbol    = HistoryDealGetString (dealTicket, DEAL_SYMBOL);
   string comment   = HistoryDealGetString (dealTicket, DEAL_COMMENT);
   double volume    = HistoryDealGetDouble (dealTicket, DEAL_VOLUME);
   double exitPrice = HistoryDealGetDouble (dealTicket, DEAL_PRICE);
   double profit    = HistoryDealGetDouble (dealTicket, DEAL_PROFIT);
   double commission= HistoryDealGetDouble (dealTicket, DEAL_COMMISSION);
   double swap      = HistoryDealGetDouble (dealTicket, DEAL_SWAP);
   datetime closeT  = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);

   //--- find the matching OPEN (entry IN) deal of the same position
   double entryPrice = 0.0;
   datetime openT = closeT;
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong t = HistoryDealGetTicket(i);
      if(t == 0) continue;
      if(HistoryDealGetInteger(t, DEAL_POSITION_ID) != position) continue;
      ENUM_DEAL_ENTRY e = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(t, DEAL_ENTRY);
      if(e != DEAL_ENTRY_IN) continue;
      entryPrice = HistoryDealGetDouble(t, DEAL_PRICE);
      openT = (datetime)HistoryDealGetInteger(t, DEAL_TIME);
      break;
   }

   //--- read SL/TP from the position's open order
   double sl = 0.0;
   double tp = 0.0;
   GetPositionSLTP(position, sl, tp);

   //--- compute rough RR (server recomputes exact values)
   double risk = fabs(entryPrice - exitPrice);
   double rr   = (risk > 0) ? (fabs(profit) / (risk * volume * 100.0)) : 0.0;

   string sideStr = (type == DEAL_TYPE_BUY) ? "buy" : "sell";

   //--- build the JSON payload (now includes sl and tp)
   string payload = StringFormat(
      "{\"token\":\"%s\",\"trades\":[{\"ticket\":\"%I64u\",\"symbol\":\"%s\",\"side\":\"%s\","
      "\"entry\":%.5f,\"exit\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"volume\":%.2f,\"pnl\":%.2f,\"commission\":%.2f,"
      "\"swap\":%.2f,\"rr\":%.2f,\"open_time\":\"%s\",\"close_time\":\"%s\","
      "\"magic\":%I64d,\"comment\":\"%s\",\"reason\":\"EA\",\"followedPlan\":true}]}",
      InpToken,
      dealTicket,
      JsonEscape(symbol),
      sideStr,
      entryPrice,
      exitPrice,
      sl,
      tp,
      volume,
      profit,
      commission,
      swap,
      rr,
      TimeToString(openT,  TIME_DATE|TIME_MINUTES),
      TimeToString(closeT, TIME_DATE|TIME_MINUTES),
      magic,
      JsonEscape(comment)
   );

   return SendToDlea(payload, dealTicket);
}

//+------------------------------------------------------------------+
//| Send the payload with WebRequest (with retries)                  |
//+------------------------------------------------------------------+
bool SendToDlea(const string payload, const ulong dealTicket)
{
   string headers = "Content-Type: application/json\r\n";
   char   data[];
   char   result[];
   string resultHeaders;
   int    timeout = 10000;

   // WHOLE_ARRAY lets StringToCharArray size the buffer automatically,
   // but it appends a trailing '\0' — strip it or the server's JSON parser
   // rejects the body with "invalid data".
   StringToCharArray(payload, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(ArraySize(data) > 0) ArrayResize(data, ArraySize(data) - 1);

   int attempts = 3;
   for(int i = 1; i <= attempts; i++)
   {
      ResetLastError();
      int status = WebRequest("POST", InpWebhookUrl, headers, timeout, data, result, resultHeaders);

      if(status == 200 || status == 201)
      {
         if(InpDebugLog) Print("DleaSync: deal #", dealTicket, " synced OK.");
         return true;
      }

      if(InpDebugLog) Print("DleaSync: attempt ", i, " failed (HTTP ", status, ", err ", GetLastError(), ")");
      if(InpDebugLog && ArraySize(result) > 0) Print("DleaSync: server said: ", CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8));
      Sleep(2000);
   }
   if(InpDebugLog) Print("DleaSync: giving up on deal #", dealTicket, " after ", attempts, " attempts.");
   return false;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("DleaSync stopped.");
}
