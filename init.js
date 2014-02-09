$(document).ready(function() {

	for (var i = 0; i < 5; ++i)
	for (var j = 0; j < 5; ++j) {
		addSyncDiv(i * 5 + j, i * 150, j * 300);
	}
});

function addSyncDiv(id, top, left) {
	var divTemplate = $('#syncDivTemplate').html();
	var template = divTemplate.format(id);
	
	$('body').append(template);
	$('#div-' + id).css('top', top);
	$('#div-' + id).css('left', left);
}

function kill(id) {
	// delete his id
	var uid = eval('uid_' + id + ' = -1');
}

function restart(id) {
	// call init again
	var fn1 = eval('get_uid_' + id);
	var fn2 = eval('load_content_' + id);
	fn1();
	setTimeout(fn2, 500);
}

//first, checks if it isn't implemented yet
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}
