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
})