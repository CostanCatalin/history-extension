$(document).ready(function() {
  var data = {
    history: [
      {
        id: 0,
        url: "https://mollit.com/",
        changesCount: 17,
        changesPercentage: "35%",
        date: "10-11-2017  11:43"
      },
      {
        id: 1,
        url: "https://duis.com/",
        changesCount: 21,
        changesPercentage: "28%",
        date: "12-10-2017  07:24"
      },
      {
        id: 2,
        url: "https://velit.com/",
        changesCount: 39,
        changesPercentage: "30%",
        date: "16-06-2017  16:49"
      },
      {
        id: 3,
        url: "https://minim.com/",
        changesCount: 22,
        changesPercentage: "38%",
        date: "25-05-2017  08:24"
      },
      {
        id: 4,
        url: "https://incididunt.com/",
        changesCount: 19,
        changesPercentage: "27%",
        date: "07-03-2017  06:41"
      }
    ],
    exceptions: [
      {
        id: 0,
        url: "https://example.com/"
      },
      {
        id: 1,
        url: "https://blocked.com/"
      },
      {
        id: 2,
        url: "https://facebook.com/"
      },
      {
        id: 3,
        url: "https://stuff.com/"
      },
      {
        id: 4,
        url: "https://cheapmangos.com/"
      }
    ]
  };
  
  for (i = 0; i < data.history.length; i++) {
      element = data.history[i];

      $('.history table').append('<tr></tr>');
      $('.history table tr:last-child').append(
        $("<td></td>").text(element.id+1),
        $("<td></td>").text(element.url),
        $("<td></td>").text(element.changesCount),
        $("<td></td>").text(element.changesPercentage),
        $("<td></td>").wrap( "<div></div>" ).text(element.date)
      );
  }

    for (i = 0; i < data.exceptions.length; i++) {
      element = data.exceptions[i];
      $('<div class="row"></div>').insertBefore('.excluded .container .pagination');
      $('.excluded .container .row:last-of-type').append(
        $('<div class="col-xs-1"></div>').text(element.id+1),
        $('<div class="col-xs-9"></div>').text(element.url),
        $('<div class="col-xs-2 remove"><span class="glyphicon glyphicon-remove"></span><span class="hidden-xs">Remove</span></div>')
      );
  }
})