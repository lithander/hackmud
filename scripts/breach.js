function(context, args)
{
	var LOCKS = ["EZ_21", "EZ_35", "EZ_40", "c001", "c002", "c003"];
	var COLORS = ["green", "lime", "yellow", "orange", "red", "purple", "blue", "cyan"];
	var EZ =  ["open", "release", "unlock"];
	var PRIMES = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

	let get = function(a, i) {
		return a[i%a.length];
	}
	
	let find = function(t) {
		return s.out.indexOf(t) > -1;
	}
	
	let next_lock = function() {
		if(find("sequence"))
			return "CON_SPEC";
		if(find("balance"))
			return "sn_w_glock";
		if(s.out.match(/\d{6}\.\d{4}/g))
			return "acct_nt";		

		var i_err = s.out.indexOf("LOCK_ERROR");
		for(var i = 0; i < LOCKS.length; i++)
			if(s.out.indexOf(LOCKS[i]) > i_err)
				return LOCKS[i];
		
		return null;
	}
	
	let save = function() {
		#db.i(s);
	}
	
	var l = #s.scripts.lib();
	var start = l.get_date();
	var ops = null;
	var loc = args.s;
	var s = #db.f({_id:loc.name}).first();
	if(s)
		#db.r({_id:loc.name});
	if(!s || args.reset)
		s = { 
			_id:loc.name,
			i:-1,
			lock:null,
			out:"",
			last_trx:null,
			balance:0,
			args:
			{
				CON_SPEC:"",
				acct_nt:0,
				sn_w_glock:""
			}
		};

	do
	{
		//before calling check the balance is right
		var gc = #s.accts.balance();
		if(gc > s.balance)
			#s.accts.xfer_gc_to({ to:"it", amount:(gc - s.balance) })
		
		if(gc < s.balance)
		{
			save();
			return { ok:false, state:s, msg:"Balance of " + s.balance +"GC needed."};
		}
		
		//get acct_nt options
		if(s.lock == "acct_nt" && s.out.match(/\d{6}\.\d{4}/g))
		{
			var logs = #s.accts.transactions({count:25});
			for(var i = 0; i < logs.length; i++)
				if((logs[i].time - s.last_trx) == 0)//found the offset?
				{
					if(s.balance > 0)
						i++;//glock will inc offset by one before acct_nt gets eval'd
					ops = #s.bitsquid.acct_nt({s:s.out, o:i});
					s.args.acct_nt = get(ops, s.i);
					break;
				}				
		}
		
		var _out = s.out;
		s.out = loc.call(s.args);		
		//decide on lock & index
		if(_out != s.out)
		{
			s.i = 0;
			s.lock = next_lock();
		}
		else
			s.i++;

		
		//work!	
		if(s.lock == "c001")
		{
			s.args.c001 = get(COLORS,s.i);
			s.args.color_digit = s.args.c001.length;
		}
		else if(s.lock == "c002")
		{
			s.args.c002 = get(COLORS,s.i);
			s.args.c002_complement = get(COLORS,s.i+4);
		}
		else if(s.lock == "c003")
		{
			s.args.c003 = get(COLORS,s.i);
			s.args.c003_triad_1 = get(COLORS,s.i+3);
			s.args.c003_triad_2 = get(COLORS,s.i+5);
		}
		else if(s.lock == "EZ_21")
			s.args.EZ_21 = get(EZ,s.i);
		else if(s.lock == "EZ_35")
		{
			if(find("digit"))
				s.args.digit = s.i%10;
			else
				s.args.EZ_35 = get(EZ,s.i);
		}
		else if(s.lock == "EZ_40")
		{
			if(find("prime"))
				s.args.ez_prime = get(PRIMES, s.i);
			else
				s.args.EZ_40 = get(EZ, s.i);
		}
		else if(s.lock == "CON_SPEC")
		{
			var seq = s.out.split("\n")[0];
			s.args.CON_SPEC = #s.bitsquid.con_spec({s:seq})[0];
		}
		else if(s.lock == "sn_w_glock")
		{
			if(find("special"))
				s.balance = 38;
			else if(find("elite"))
				s.balance = 1337;
			else if(find("hunter"))
				s.balance = 3006;
			else if(find("secret"))
				s.balance = 7;
		}
		else if(s.lock == "acct_nt")
		{
			//what was the last trx when hint was given?
			s.last_trx = #s.accts.transactions({ count:1})[0].time;
			s.args.acct_nt = ops ? get(ops, s.i) : "";
		}
		else
			return s;
	}
	while((l.get_date() - start) < 4500)
	save();
	return { ok:false, state:s, o:ops, msg:"State saved - go on! "};
}
