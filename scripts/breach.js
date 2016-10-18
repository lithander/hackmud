function(context, args)
{
	var LOCKS = ["EZ_21", "EZ_35", "EZ_40", "c001", "c002", "c003", "acct_nt", "CON_SPEC", "sn_w_glock"];
	var COLORS = ["green", "lime", "yellow", "orange", "red", "purple", "blue", "cyan"];
	var EZ =  ["open", "release", "unlock"];
	var PRIMES = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

	let open_locks = function() { 
		return (s.out.match(/LOCK_UNLOCKED/g) || []).length;
	}
	
	let get = function(a, i) {
		return a[i%a.length];
	}
	
	let find = function(t) {
		return s.out.indexOf(t) > -1;
	}
	
	let next_lock = function() {
		var i_err = s.out.indexOf("LOCK_ERROR");
		for(var i = 0; i < LOCKS.length; i++)
			if(s.out.indexOf(LOCKS[i]) > i_err)
				return LOCKS[i];
		
		return null;
	}
	
	let save = function() {
		#db.i(s);
	}
	
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
			args:{}
		};

	for(var t = 0; t < 25; t++)
	{
		//before calling check the balance is right
		var gc = #s.accts.balance();
		if(gc > s.balance)
			#s.accts.xfer_gc_to({ to:"it", amount:(gc - s.balance) })
		
		if(gc < s.balance)
		{
			save();
			return { ok:false, state:s, msg:"Ensure balance is " + s.balance};
		}
		
		//get acct_nt options
		if(s.lock == "acct_nt" && s.out.match(/\d{6}\.\d{4}/g))
		{
			var logs = #s.accts.transactions({count:25});
			for(var i = 0; i < logs.length; i++)
				if((logs[i].time - s.args.last_trx) == 0)//found the offset?
				{
					if(s.balance > 0)
						i++;//the glock will inc offset by one before acct_nt gets eval'd
					ops = #s.bitsquid.acct_nt({s:s.out, o:i});
					s.args.acct_nt = get(ops, s.i);
					break;
				}				
		}
		
		var old_open = open_locks(s.out);
		s.out = loc.call(s.args);
		
		if(open_locks(s.out) > old_open)
			s.lock = null;
		
		//decide on lock & index
		if(!s.lock)
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
			if(find("sequence"))
			{
				var seq = s.out.split("\n")[0];
				s.args.CON_SPEC = #s.bitsquid.con_spec({s:seq})[0];
			}
			else
				s.args.CON_SPEC = "";
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
			else
				s.args.sn_w_glock = "";
		}
		else if(s.lock == "acct_nt")
		{
			//what was the last trx when hint was given?
			s.args.last_trx = #s.accts.transactions({ count:1})[0].time;
			s.args.acct_nt = ops ? get(ops, s.i) : "";
		}
		else
			return s;
	}
	save();
	return { ok:false, state:s, o:opts, msg:"State saved - go on! "};
}
