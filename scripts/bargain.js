function(context, args)
{
	//{n:["transfer_v1", "balance_v1", "transactions_v1", "CON_SPEC", "acct_nt", "sn_w_glock"]}
    var caller = context.caller;
    var l = #s.scripts.lib();
    var result = [];
    for(var i = 0; i < args.n.length; i++)
    {
        result.push(args.n[i]);
        var qr = #s.market.browse({name:args.n[i]});
        if(qr.length >= 1)
        {
            var entry = qr[0];
            entry.cost = l.to_gc_str(entry.cost);
            result.push(entry);
        }
    }
    return { ok:true, msg:result };
}