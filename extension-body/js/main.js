document.addEventListener('DOMContentLoaded', function() {
    var d = document.querySelectorAll('footer a');
    d[0].addEventListener('click', function() {
        chrome.tabs.create({
            'url': this.href
        });
    });
});
