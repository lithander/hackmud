//EXAMPLE: qr{ s:#s.weyland.memberlogin, a:{ username:"m_clarke_dunk", get:"order_qrs" }}
function(context, args)
{
	var caller = context.caller;
	var l = #s.scripts.lib();
	//call the passed script 's' with the args 'a' then return the result
	var input = args.s.call(args.a);
	var result = [];
	for(var j = 1; j < input.length; j++)
	{
		var qrc = input[j];
		if(qrc == "<qr missing>")
			continue;
		var len = qrc.indexOf("\n") + 6;
		var block = "█".repeat(len) + "\n";
		var pad = true;
		for(var i = 0; i < qrc.length; i++)
		{
			if(pad)
			{
				block += "███";
				pad = false;
			}
			if(qrc[i] == "█")
				block += " ";
			else if(qrc[i] == " ")
				block += "█";
			else if(qrc[i] == "▀")
				block += "▄";
			else if(qrc[i] == "▄")
				block += "▀";
			else if(qrc[i] == "\n")
			{
				block += "███\n";
				pad = true;
			}
			else
				block += qrc[i];
		}
		block += "█".repeat(len);
		result.push(block);
	}
	return { ok:true, msg:result};
}