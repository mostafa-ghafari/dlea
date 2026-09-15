//+------------------------------------------------------------------+
//|                                                  DleaSync.mq5    |
//|              Dlea AI - MetaTrader 5 trade sync expert            |
//+------------------------------------------------------------------+
#property copyright "Dlea AI"
#property version   "1.06"
#property strict
#property description "Syncs closed trades from MetaTrader 5 to Dlea AI"

//--- inputs ----------------------------------------------------------
input string InpWebhookUrl  = "http://127.0.0.1:8000/api/trades/webhook/"; // Dlea webhook URL
input string InpToken       = "YOUR_TOKEN_HERE";                          // Webhook token (from settings)
input bool   InpSyncHistory = true;                                       // Import existing closed trades on start
input int    InpBackfillDays= 0;                                          // Backfill window in days (0 = everything MT has)
input bool   InpDebugLog    = true;                                       // Print sent deals to log

ulong g_lastDeal = 0; // dedupe: last deal ticket we already sent

//--- SL/TP cache: position ticket → {sl, tp} -------------------------
// In MT5, when a position closes the original order's SL/TP are reset
// to 0. We must capture them while the position is still open.
#define CACHE_SIZE 512
ulong g_cacheKeys[CACHE_SIZE];
double g_cacheSL[CACHE_SIZE];
double g_cacheTP[CACHE_SIZE];
int g_cacheCount = 0;

//+------------------------------------------------------------------+
//| Store SL/TP for a position in the cache                           |
//| Returns true when the stored values actually changed (so callers   |
//| that refresh on every tick stay quiet in the log).                |
//+------------------------------------------------------------------+
bool CacheSLTP(ulong posTicket, double sl, double tp)
{
   // Update existing entry
   for(int i = 0; i < g_cacheCount; i++)
   {
      if(g_cacheKeys[i] == posTicket)
      {
         if(g_cacheSL[i] == sl && g_cacheTP[i] == tp)
            return false;
         g_cacheSL[i] = sl;
         g_cacheTP[i] = tp;
         if(InpDebugLog) Print("DleaSync: cached SL/TP for pos #", posTicket, " sl=", sl, " tp=", tp);
         return true;
      }
   }
   // Add new entry
   if(g_cacheCount < CACHE_SIZE)
   {
      g_cacheKeys[g_cacheCount] = posTicket;
      g_cacheSL[g_cacheCount] = sl;
      g_cacheTP[g_cacheCount] = tp;
      if(InpDebugLog) Print("DleaSync: cached SL/TP for pos #", posTicket, " sl=", sl, " tp=", tp);
      g_cacheCount++;
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Read a level out of MT5's own close comment.                      |
//| MT5 writes "[sl 1.16225]" / "[tp 1.16204]" on the deal that closed |
//| the position; that is the last resort when the live SL/TP was      |
//| never captured (e.g. it was added after the position opened).      |
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
//| Read cached SL/TP for a position. Returns true if found.          |
//+------------------------------------------------------------------+
bool GetCachedSLTP(ulong posTicket, double &sl, double &tp)
{
   for(int i = 0; i < g_cacheCount; i++)
   {
      if(g_cacheKeys[i] == posTicket)
      {
         sl = g_cacheSL[i];
         tp = g_cacheTP[i];
         return true;
      }
   }
   return false;
}

//+------------------------------------------------------------------+
//| Remove a position from the cache after it's been synced           |
//+------------------------------------------------------------------+
void RemoveFromCache(ulong posTicket)
{
   for(int i = 0; i < g_cacheCount; i++)
   {
      if(g_cacheKeys[i] == posTicket)
      {
         // Shift remaining entries
         for(int j = i; j < g_cacheCount - 1; j++)
         {
            g_cacheKeys[j] = g_cacheKeys[j+1];
            g_cacheSL[j]   = g_cacheSL[j+1];
            g_cacheTP[j]   = g_cacheTP[j+1];
         }
         g_cacheCount--;
         return;
      }
   }
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

   // Warm-up: scan currently open positions to cache their SL/TP
   CacheOpenPositions();

   Print("DleaSync v1.04 started. Waiting for closed trades...");

   // Backfill: import trades that closed before the EA was attached.
   if(InpSyncHistory)
      SyncHistory();

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Scan all open positions and cache their *current* SL/TP.          |
//| Called at start-up and on every tick: when the trader adds or      |
//| moves a stop on a live position MT5 only emits a position change   |
//| (no new deal), so a one-shot capture at open time would keep the   |
//| stale zero forever and the stop would never reach Dlea.            |
//+------------------------------------------------------------------+
void CacheOpenPositions()
{
   int total   = PositionsTotal();
   int changed = 0;
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(CacheSLTP(ticket, PositionGetDouble(POSITION_SL), PositionGetDouble(POSITION_TP)))
         changed++;
   }
   if(InpDebugLog && changed > 0)
      Print("DleaSync: SL/TP cache refreshed for ", changed, " open position(s).");
}

//+------------------------------------------------------------------+
//| Import every already-closed position from history (backfill)     |
//+------------------------------------------------------------------+
void SyncHistory()
{
   //--- MT5 only serves history it has actually downloaded, so an account
   //--- whose deals are months old can look "incomplete" until the terminal
   //--- fetches that range (open the History tab and scroll back).
   datetime from = 0;
   if(InpBackfillDays > 0)
      from = TimeCurrent() - (datetime)InpBackfillDays * 86400;

   if(!HistorySelect(from, TimeCurrent()))
   {
      Print("DleaSync: could not load history.");
      return;
   }

   int total = HistoryDealsTotal();
   Print("DleaSync: backfill window from ", TimeToString(from == 0 ? 0 : from, TIME_DATE),
         " — MT returned ", total, " history deals.");

   int closed  = 0;
   int sent    = 0;
   int failed  = 0;
   for(int i = 0; i < total; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0) continue;

      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT) continue;

      closed++;
      if(SendDeal(dealTicket)) sent++;
      else failed++;
   }

   //--- Printed unconditionally: this line is how you tell whether a missing
   //--- row was never given to the EA, or was rejected on the way out.
   Print("DleaSync: backfill summary — deals=", total, " closed=", closed,
         " accepted=", sent, " failed=", failed);
   if(closed < total)
      Print("DleaSync: note ", total - closed, " deal(s) were entries/balance "
            "operations, not closed trades.");
}

//+------------------------------------------------------------------+
//| Track deals: cache SL/TP on open, send on close                 |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   //--- SL/TP edited on a live position: refresh the cache from the
   //--- position itself (this is the case that used to be dropped).
   if(trans.type == TRADE_TRANSACTION_POSITION)
   {
      ulong posTicket = trans.position;
      if(posTicket > 0 && PositionSelectByTicket(posTicket))
         CacheSLTP(posTicket,
                   PositionGetDouble(POSITION_SL),
                   PositionGetDouble(POSITION_TP));
   }

   //--- When a new deal is added to history...
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong dealTicket = trans.deal;
      if(dealTicket == 0) return;

      if(!HistorySelect(0, TimeCurrent())) return;

      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      ulong position = (ulong)HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);

      //--- ENTRY IN: position opened → cache SL/TP from the order
      if(entry == DEAL_ENTRY_IN && position > 0)
      {
         ulong orderTicket = (ulong)HistoryDealGetInteger(dealTicket, DEAL_ORDER);
         if(HistoryOrderSelect(orderTicket))
         {
            double sl = HistoryOrderGetDouble(orderTicket, ORDER_SL);
            double tp = HistoryOrderGetDouble(orderTicket, ORDER_TP);
            CacheSLTP(position, sl, tp);
         }
      }

      //--- ENTRY OUT: position closed → send to server
      if(entry == DEAL_ENTRY_OUT)
      {
         if(dealTicket == g_lastDeal) return;
         g_lastDeal = dealTicket;
         SendDeal(dealTicket);
         RemoveFromCache(position);
      }
   }


}

//+------------------------------------------------------------------+
//| Keep the SL/TP cache in step with the open positions             |
//+------------------------------------------------------------------+
void OnTick()
{
   CacheOpenPositions();
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

   //--- get SL/TP from cache (captured when position was open)
   double sl = 0.0;
   double tp = 0.0;
   if(!GetCachedSLTP((ulong)position, sl, tp))
   {
      // Fallback: try reading from the entry order in history
      for(int i = 0; i < total; i++)
      {
         ulong t = HistoryDealGetTicket(i);
         if(t == 0) continue;
         if(HistoryDealGetInteger(t, DEAL_POSITION_ID) != position) continue;
         ENUM_DEAL_ENTRY e = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(t, DEAL_ENTRY);
         if(e != DEAL_ENTRY_IN) continue;
         ulong orderTicket = (ulong)HistoryDealGetInteger(t, DEAL_ORDER);
         if(HistoryOrderSelect(orderTicket))
         {
            sl = HistoryOrderGetDouble(orderTicket, ORDER_SL);
            tp = HistoryOrderGetDouble(orderTicket, ORDER_TP);
         }
         break;
      }
   }

   //--- last resort: the level MT5 itself closed the position at
   if(sl <= 0 && ParseLevelFromComment(comment, "sl", sl) && InpDebugLog)
      Print("DleaSync: SL recovered from deal comment for pos #", position, " -> ", sl);
   if(tp <= 0 && ParseLevelFromComment(comment, "tp", tp) && InpDebugLog)
      Print("DleaSync: TP recovered from deal comment for pos #", position, " -> ", tp);

   //--- R:R = how far price actually travelled / how much was risked.
   //--- It needs the stop (the old formula divided by volume x 100 and
   //--- produced nonsense like 617). Without a stop the ratio does not
   //--- exist, so 0 is the honest value.
   double rr = 0.0;
   if(sl > 0)
   {
      double risk = fabs(entryPrice - sl);
      if(risk > 0)
         rr = fabs(exitPrice - entryPrice) / risk;
   }

   string sideStr = (type == DEAL_TYPE_BUY) ? "buy" : "sell";

   //--- debug: print SL/TP to MT5 Experts log (read into temporaries so
   //--- the print never overwrites the values we are about to send)
   double dbgSL = 0.0, dbgTP = 0.0;
   bool   cacheHit = GetCachedSLTP((ulong)position, dbgSL, dbgTP);
   if(InpDebugLog)
      Print("DleaSync: deal #", dealTicket, " ", symbol, " SL=", sl, " TP=", tp,
            " (cache hit=", cacheHit ? "yes" : "no", ", cached SL=", dbgSL, ", cached TP=", dbgTP, ")");

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
