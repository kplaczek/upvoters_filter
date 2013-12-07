// ==UserScript==
// @name upvoters_filter
// @namespace git_script
// @include     http://www.wykop.pl/moj/*
// @include     http://www.wykop.pl/mikroblog/*
// @include     http://www.wykop.pl/ludzie/*
// @include     http://www.wykop.pl/wpis/*
// @include     http://www.wykop.pl/tag/*
// @include     http://www.wykop.pl/ustawienia/
// @version 1
// @grant none
// ==/UserScript==




function main() {


    var elementy = [];
    var followers = [];
    var len = undefined;
    var timer;
    $('body').on('click', '.toggleTrigger', function() {
        $(this).next('div').toggleClass('dnone');
    })

    resolveLocalStorageTexts();
    if (document.location.href.indexOf("http://www.wykop.pl/ustawienia") !== -1) {

        var settingsBox = generateSettingsBox('Skrypt plusów');

        var pPlural = $('<p />');
        pPlural.append($('<label />').addClass('fb_dig').text('Liczba mnoga:').css({'width': '150px', 'display': 'inline-block'}));

        pPlural.append($('<input />').addClass('plural').val(localStorage.plural));

        var pSingular = $('<p />');
        pSingular.append($('<label />').addClass('fb_dig').text('Liczba pojedyncza:').css({'width': '150px', 'display': 'inline-block'}));

        pSingular.append($('<input />').addClass('singular').val(localStorage.singular));
        settingsBox.find('.content').append(pPlural).append(pSingular);

        $('div.marginbott20').has('fieldset').last().after(settingsBox);

        $('.plural, .singular').keyup(handleTextChange);
    }

    getFollowedUsers(1, true);
    $(document).ready(function() {
        elementy = $('.votLiC').has('a');
        $(window).scroll(function() {
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(handleScroll, 200);
        });
        $(document).ajaxSuccess(function(e, xhr, settings) {
            //nastepna strona na mirko 
            if (settings.url.indexOf("http://www.wykop.pl/mikroblog/next/") !== -1)
            {

                //@TODO poprawić dodawanie nowych elementów przy wczytywaniu stron
                elementy = $('.votLiC').has('a').not('.checkedAndDone');
            }
            //doÂładowanie komentarzy do wpisu
            if (settings.url.indexOf("http://www.wykop.pl/ajax/entries/comments/") !== -1)
            {
                var liId = /entries\/comments\/(\d*)/img.exec(settings.url);
                var newElements = $('li[data-id="' + liId[1] + '"] .subcomments .votLiC').has('a');
                for (var i = 0, e = newElements.length; i < e; ++i) {
                    if ($(newElements[i]).has('a.showVoters').length > 0)
                    {
                        $($(newElements[i]).find('a.showVoters')[0]).click();
                    } else
                    {
                        formatVoters(newElements[i]);
                    }
                }
            }
            
            //odczytanie listy plusujących
            if (settings.url.indexOf("http://www.wykop.pl/ajax2/entries/upvoters/") !== -1 ||
                    settings.url.indexOf("http://www.wykop.pl/ajax2/entries/commentupvoters/") !== -1
                    )
            {

                var liId = /upvoters\/(\d*)/img.exec(settings.url);
                var id = liId[1];
                var voteLiC = $('li[data-id="' + id + '"]').find('.votLiC').first();
                formatVoters(voteLiC);
            }

        });
    })

    function formatVoters(element)
    {
        followers = getFollowedUsers(1, false);
        var keepers = [];
        var nonames = [];
        $(element).find('a').each(function(i, e) {
            var nick = $.trim($(e).text());
            if (followers.indexOf(nick) === -1)
            {
                nonames.push(e);
                nonames.push(document.createTextNode("  "));
            } else {
                keepers.push(e);
                keepers.push(document.createTextNode("  "));
            }
        })

        $(element).html('+: ');
        $(element).append(keepers);

        if (nonames.length > 0)
        {
            if (keepers.length > 0)
                $(element).append(document.createTextNode('oraz '));
            $(element).append($('<span/>').addClass('toggleTrigger cpointer').text((nonames.length / 2) + " " + handleText(nonames.length / 2)));
            $(element).append($('<div/>').addClass('dnone').append(nonames));
            $(element).addClass('checkedAndDone');
        }
    }


    function handleText(number)
    {
        return (number > 1) ? localStorage.plural : localStorage.singular;
    }

    /**
     * return user own username if logged in 
     * @returns {jQuery} username
     */
    function getOwnUsername()
    {
        return $('nav.main .avatar a.quickicon').attr('title');
    }


    function generateSettingsBox(title)
    {
        var settingsBox = $('<div />');
        settingsBox.addClass('fblock margin10_0 marginbott20');
        var fieldset = $('<fieldset />').addClass('bgf6f6f6 pding5');

        var h3 = $('<h3 />').addClass('large fbold fleft').text(title);
        var fleft = $('<div />').addClass('fleft content');
        settingsBox.append(fieldset.append(h3).append(fleft));
        return settingsBox;
    }


    function getFollowedUsers(page, force)
    {
        if (force === true)
        {
            if (localStorage.followed == undefined)
                localStorage.followed = JSON.stringify([getOwnUsername()]);
            if (typeof page === undefined)
                page = 1;
            $.ajax({
                url: "http://www.wykop.pl/ludzie/followed/" + getOwnUsername() + '/strona/' + page + '/'
            }).done(function(data) {
                $data = $(data);

                followers = JSON.parse(localStorage.followed);

                if (typeof len === "undefined" && $data.find('.pager a').length > 0)
                {
                    len = $data.find('.pager a').length - 1;
                }
                var a = $data.find('.peoplewall').find('a');
                a.each(function(i, e) {
                    followers.push($.trim($(e).text()));
                });

                localStorage.followed = JSON.stringify(followers);

                if (typeof len == "number" && len !== page)
                    getFollowedUsers(page + 1, true);
            })
        } else
        {
            if (localStorage.followed != undefined)
            {
                followers = JSON.parse(localStorage.followed);
                return JSON.parse(localStorage.followed);
            }
        }

    }


    function handleScroll()
    {
        var windowHeight = $(window).height();
        var windowScrollTop = $(window).scrollTop();
        for (var i = 0, e = elementy.length - 1; i < e; i++)
        {

            var elementOffsetTop = $(elementy[i]).offset().top;
            if (elementOffsetTop > windowScrollTop && elementOffsetTop < windowScrollTop + windowHeight + 400)
            {
                if ($(elementy[i]).find('a.showVoters').length == 1)
                {
                    $($(elementy[i]).find('a.showVoters')[0]).click();
                    elementy.splice(i, 1);
                } else
                {
                    formatVoters(elementy[i]);
                    elementy.splice(i, 1);
                }
            }
        }
    }


    function resolveLocalStorageTexts()
    {
        if (localStorage.plural === undefined)
            localStorage.plural = "noname'ów";
        if (localStorage.singular === undefined)
            localStorage.singular = "noname";
    }

    function handleTextChange(e, x)
    {
        localStorage[$(e.target).attr('class')] = $(e.target).val();
    }
}


if (typeof $ == 'undefined') {
    if (typeof unsafeWindow !== 'undefined' && unsafeWindow.jQuery) {
        var $ = unsafeWindow.jQuery;
        main();
    } else {
        addJQuery(main);
    }
} else {
    main();
}
function addJQuery(callback) {
    var script = document.createElement("script");
    script.textContent = "(" + callback.toString() + ")();";
    document.body.appendChild(script);
}
