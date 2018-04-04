window.onload = function()
{
	// Get the modal
	var modal1 = document.getElementById('classicModal');
	var modal2 = document.getElementById('diagonalModal');
	var modal3 = document.getElementById('megaModal');
	
	// Get the button that opens the modal
	var btn1 = document.getElementById("classicBtn");
	var btn2 = document.getElementById("diagonalBtn");
	var btn3 = document.getElementById("megaBtn");

	// Get the <span> element that closes the modal
	var span1 = document.getElementsByClassName("close1")[0];
	var span2 = document.getElementsByClassName("close2")[0];
	var span3 = document.getElementsByClassName("close3")[0];

	// When the user clicks the button, open the modal 
	btn1.onclick = function() 
	{
		classicModal.style.display = "block";
	}
	
	// When the user clicks the button, open the modal
	btn2.onclick = function() 
	{
		diagonalModal.style.display = "block";
	}
	
	// When the user clicks the button, open the modal
	btn3.onclick = function() 
	{
		megaModal.style.display = "block";
	}

	// When the user clicks on <span> (x), close the modal
	span1.onclick = function() 
	{
		classicModal.style.display = "none";
	}
	span2.onclick = function() 
	{
		diagonalModal.style.display = "none";
	}
	span3.onclick = function() 
	{
		megaModal.style.display = "none";
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) 
	{
		if (event.target == classicModal) 
		{
			classicModal.style.display = "none";
		}
		if (event.target == classicModal) 
		{
			classicModal.style.display = "none";
		}
		if (event.target == classicModal) 
		{
			classicModal.style.display = "none";
		}
	}
}