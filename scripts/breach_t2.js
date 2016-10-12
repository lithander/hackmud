function(context, args)
{
	let get_offset = function(ref)
	{
		var trx = #s.accts.transactions();
		for(var i = 0; i < trx.length; i++)
			if(trx[i].time.getTime() < ref)
				return i;

		return -1;
	}
	
	let log = function(name, args, results)	
	{
		l.log(name + JSON.stringify(args));
		l.log("  => "+JSON.stringify(results));
	}

	var loc = args.s;
	var caller = context.caller;
	var l = #s.scripts.lib();
	//make sure we don't lose 1M to glock
	var gc = #s.accts.balance();
	if(gc > 3006)
		#s.accts.xfer_gc_to({ to:"it", amount:gc })
	//print lock info
	//l.log(l.security_level_names[#s.scripts.get_level({name:loc.name})]);

	//restart?
	var rec = {_id:loc.name};
	if(args.reset)
		#db.r(rec);
	//retrieve lock args
	var loc_info = #db.f(rec).first();
	if(!loc_info)
	{
		l.log("No records found on "+loc.name);
		loc_info = { 
			_id:loc.name,
			num_try:-1,
			args:
			{
				CON_SPEC:"",
				acct_nt:0,
				sn_w_glock:""
			}
		}
		#db.i(loc_info);
	}
	if(l.is_str(loc_info.args.acct_nt))
	{
		var acct_args = {s:loc_info.args.acct_nt, o:get_offset(loc_info.time_try)};
		var options = #s.bitsquid.acct_nt(acct_args);
		if(options.length > 0)
		{		
			var i = loc_info.num_try % options.length;
			loc_info.args.acct_nt = options[i];
		}
		log("acct_nt", acct_args, options);
	}
	//call the lock with the params retrieved from db
	var hint = loc.call(loc_info.args);
	log(loc.name, loc_info.args, hint);
	
	//action required?
	if(hint.indexOf("sequence") > -1)
	{
		//Provide the next three letters in the sequence
		var seq = hint.split("\n")[0];
		var con_args = {s:seq};
		var key = #s.bitsquid.con_spec(con_args);
		#db.u(rec, {$set:{"args.CON_SPEC":key[0]}});
		log("con_spec", con_args, key);
	}
	else if(hint.indexOf("balance") > -1)
	{		
	}
	else if(hint.indexOf("between") > -1 || hint.indexOf("around") > -1 || hint.indexOf("large") > -1)
	{
		#db.u(
			rec, 
			{
				$inc:{num_try:1},
				$set:
				{
					"args.acct_nt":hint, 
					time_try:l.get_date_utcsecs()
				},
			});
	}
	else
		l.log("LockType ERROR: " + hint);
		
	//#db.f(rec).first()
	return l.get_log();
}
