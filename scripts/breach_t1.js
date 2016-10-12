function(context, args)
{
	var LOCKS = ["EZ_21", "EZ_35", "EZ_40", "c001", "c002", "c003"];
	var COLORS = ["green", "lime", "yellow", "orange", "red", "purple", "blue", "cyan"];
	var EZ =  ["open", "release", "unlock"];
	var PRIMES = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

	var loc = args.s;
	
	let open_cnt = function(s) { 
		return (s.match(/LOCK_UNLOCKED/g) || []).length;
	}
	
	var locks = {};
	var hint = loc.call(locks);
	var i_err = hint.indexOf("LOCK_ERROR");
	while(true)
	{
		if(i_err == -1)
			return [locks, hint];

		var lk = "";
		for(var i = 0; i < LOCKS.length; i++)
			if(hint.indexOf(LOCKS[i]) > i_err)
			{
				lk = LOCKS[i];
				break;
			}
			
		var breached_locks = open_cnt(hint);
		for(var i = 0; true; i++)
		{
			if(lk == "c001")
			{
				locks.c001 = COLORS[i%COLORS.length];
				locks.color_digit = locks.c001.length;
			}
			else if(lk == "c002")
			{
				locks.c002 = COLORS[i%COLORS.length];
				locks.c002_complement = COLORS[(i+4)%COLORS.length];
			}
			else if(lk == "c003")
			{
				locks.c003 = COLORS[i%COLORS.length];
				locks.c003_triad_1 = COLORS[(i+3)%COLORS.length];
				locks.c003_triad_2 = COLORS[(i+5)%COLORS.length];;
			}
			else if(lk == "EZ_21")
				locks.EZ_21 = EZ[i%EZ.length];
			else if(lk == "EZ_35")
			{
				if(hint.indexOf("digit") == -1)
					locks.EZ_35 = EZ[i%EZ.length];
				else
					locks.digit = i%10;
			}
			else if(lk == "EZ_40")
			{
				if(hint.indexOf("prime") == -1)
					locks.EZ_40 = EZ[i%EZ.length];
				else
					locks.ez_prime = PRIMES[(i+25)%PRIMES.length];
			}
			else
				return { ok:false, state:locks, msg:hint};
			
			hint = loc.call(locks);
			i_err = hint.indexOf("LOCK_ERROR");
			if(open_cnt(hint) > breached_locks || i_err == -1)
				break;
		}
	}	
}
