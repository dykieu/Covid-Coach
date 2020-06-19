'use strict';

console.log("Connected");

//Scroll function
$(function() {
    $(document).scroll(function() {
        var $nav = $("#mainNavbar");
        $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
    });
});

$(function() {
    $(document).scroll(function() {
        var $nav = $("#mainNavbar");
        $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
    });

    $("#ask").click(function() {
        $(".messageform").css('display', 'block');
    });
    
    $("#cancel").click(function() {
        $(".messageform").css('display', 'none');
    });

    $(".comment").click(function() {
        $(".textareaContent" + $(this).data('id')).css('display', 'block')
        $(".Done" + $(this).data('id')).css('display', 'block')
    });

    $('.cancelComment').click((button) =>{
        $(".textareaContent" + button.target.id).css('display', 'none');
        $(".Done" + button.target.id).css('display', 'none');
    });

    $('.editmsg').click((button) => {
        console.log(button.target.value);
        $(".messageEdit" + button.target.value).css('display', 'block');
    });

    $('.cancelEdit').click((button) => {
        console.log(button.target.value);
        $(".messageEdit" + button.target.value).css('display', 'none');
    });

    $(".del").click(() =>{
        $(".content" + $(this).data('id')).css('display', 'none');
        $.ajax({
            type: "GET",
            url: "/message?deleteId="+$(this).data('id'),
            dataType: "json",
            success: function(data){
            }
        });
    });
});