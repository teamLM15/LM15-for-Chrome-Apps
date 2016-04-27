/* global OAuth, NEW_ENTRY */

// 定数定義
var OAUTH_TOKEN = "oauth_token=";
var OAUTH_TOKEN_SECRET = "oauth_token_secret=";
var PIN_STR = "[PIN]：";
var NEW_ENTRY = "NEW ENTRY";

var twitterApiKey = {
    "consumerKey": "JT7KQf8ChYIIYYiX2NVdJ4Dg5",
    "consumerSecret": "xO3yDjXva6C6tAm5ZHIkfzQU21tOS7O7MDD5eB78D6rlprwoAw",
    "accessToken": "",
    "accessTokenSecret": "",
    "requestToken": "",
    "requestTokenSecret": ""
};

// ハッシュタグ文字列
var _hashStr = "";
// プロンプト文字列
var _promStr = ">";


$(document).ready(function () {

    // 認証状態判定
    judgeAuth();

    // キーボード押下時の処理
    $("#inputText").keyup(function (e) {
        if (e.keyCode === 13) {
            if ($("#consoleText").html() === PIN_STR) {
                var postStr = $.trim($("#inputText").val());
                $("#inputText").val("");
                authPinTxt(postStr);
                // 認証時のoutputTextはajaxのsuccessで行う。
            } else {
//                投稿文字列を一旦退避
                var postStr = $.trim($("#inputText").val());
                $("#inputText").val("");
                doPost(postStr);
//                 $("#outputText").html(createOutputStr(postStr));
//                $("#consoleText").html(_promStr);
            }

        }
    });
    $('#inputText').keydown(function (e) {
        if (e.which == 13) {
            return false;
        }
    }).bind('blur', function () {
        // 貼りつけられたテキストの改行コードを削除
        var $textarea = $(this),
                text = $textarea.val(),
                new_text = text.replace(/\n/g, "");
        if (new_text != text) {
            $textarea.val(new_text);
        }
    });
});

function authInit() {
    var accessor = {
        consumerSecret: twitterApiKey.consumerSecret,
        tokenSecret: ''
    };

    var message = {
        method: "GET",
        action: "https://api.twitter.com/oauth/request_token",
        parameters: {
            oauth_signature_method: "HMAC-SHA1",
            oauth_consumer_key: twitterApiKey.consumerKey
        }
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var target = OAuth.addToURL(message.action, message.parameters);

    var options = {
        type: message.method,
        url: target,
        success: function (d) {
            console.debug("requestToken:" + d);
            var paramArry = d.split("&");
            console.debug("paramArry:" + paramArry);
            var oauthToken, oauthTokenSecret;
            for (var cnt = 0; cnt < paramArry.length; cnt++) {
                var param = paramArry[cnt];
                if (param.indexOf(OAUTH_TOKEN) != -1) {
                    oauthToken = param.substring(OAUTH_TOKEN.length);
                } else if (param.indexOf(OAUTH_TOKEN_SECRET) != -1) {
                    oauthTokenSecret = param.substring(OAUTH_TOKEN_SECRET.length);
                }
            }
            console.debug("oauthToken:" + oauthToken);
            console.debug("oauthTokenSecret:" + oauthTokenSecret);

            twitterApiKey.requestToken = oauthToken;
            twitterApiKey.requestTokenSecret = oauthTokenSecret;

            // 認証URLの取得
            window.open("https://api.twitter.com/oauth/authenticate?oauth_token=" + oauthToken);
            $("#consoleText").html(PIN_STR);
        }
    };
    $.ajax(options); // 送信
}


// PIN入力によるアクセストークン取得処理
function authPinTxt(d) {
    console.debug("authUrl:" + d);

    var accessor = {
        consumerSecret: twitterApiKey.consumerSecret,
        tokenSecret: twitterApiKey.requestTokenSecret
    };

    var message = {
        method: "GET",
        action: "https://api.twitter.com/oauth/access_token",
        parameters: {
            oauth_signature_method: "HMAC-SHA1",
            oauth_consumer_key: twitterApiKey.consumerKey,
            oauth_token: "",
            oauth_verifier: ""
        }
    };

    message.parameters.oauth_token = twitterApiKey.requestToken;
    message.parameters.oauth_verifier = d;

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var target = OAuth.addToURL(message.action, message.parameters);

    var options = {
        type: message.method,
        url: target,
        success: function (a) {
            console.debug("accessToken:" + a);
            var paramArry = a.split("&");
            console.debug("paramArry:" + paramArry);
            var oauthToken, oauthTokenSecret;
            for (var cnt = 0; cnt < paramArry.length; cnt++) {
                var param = paramArry[cnt];
                if (param.indexOf(OAUTH_TOKEN) != -1) {
                    oauthToken = param.substring(OAUTH_TOKEN.length);
                } else if (param.indexOf(OAUTH_TOKEN_SECRET) != -1) {
                    oauthTokenSecret = param.substring(OAUTH_TOKEN_SECRET.length);
                }
            }
            console.debug("accessToken:" + oauthToken);
            console.debug("accessTokenSecret:" + oauthTokenSecret);

            twitterApiKey.accessToken = oauthToken;
            twitterApiKey.accessTokenSecret = oauthTokenSecret;

            // 取得したすべてのキーをマップに詰める
            chrome.storage.sync.set(twitterApiKey, function () {});
            createOutputStr(d);
            createConsoleStrOnly(NEW_ENTRY);
            $("#consoleText").html(_promStr);
            $("#inputText").val("");
        },
        error: function (a) {
            console.debug("status : " + a.status);
            console.debug("message : " + a.responseText);
            createOutputStr(d);
            createConsoleStrOnly("Try again.");
            $("#inputText").val("");
            // 本来ならばPINの入れなおしで行けるはずだがエラーが返ってくるので
            // 最初から認証し直す。
            authInit();
        }
    };
    $("#inputText").val("");
    $("#inputText").val(d);
    $.ajax(options); // 送信

}

// POST
function doPost(d) {
    console.debug("postStr:" + d);

    // 何も入力されていない場合はそのままリターン
    if ($.trim(d).length === 0) {
        createOutputStr(d);
        createConsoleStrOnly("Post error.");
        $("#inputText").val("");
        return;
    }

    // 投稿文字列と出力文字列が異なるケースがあるので退避
    var postStr = d;

    switch (postStr) {
        case '#clear':
            // 一応これはデバッグ用
            chrome.storage.sync.clear(function () {});
            createConsoleStrOnly("clear auth data.");
            $("#inputText").val("");
            authInit();
            return;
        case '前回のラブライブ！':
            if (_hashStr.length <= 0){
                postStr = doLm15();
            }
            break;
        case '#':
            _hashStr = "";
            $("#consoleText").html(_promStr);
            $("#inputText").val("");
            return;
    }
    // ハッシュタグ設定
    if (postStr.indexOf('#') === 0) {
        _hashStr = postStr;
        $("#consoleText").html(_hashStr + _promStr);
        return;
    }

    var accessor = {
        consumerSecret: twitterApiKey.consumerSecret,
        tokenSecret: twitterApiKey.accessTokenSecret
    };

    var message = {
        method: "POST",
        action: "https://api.twitter.com/1.1/statuses/update.json",
        parameters: {
            oauth_signature_method: "HMAC-SHA1",
            oauth_consumer_key: twitterApiKey.consumerKey,
            oauth_token: twitterApiKey.accessToken,
            status: postStr + " " + _hashStr
        }
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var target = OAuth.addToURL(message.action, message.parameters);

    var options = {
        type: message.method,
        url: target,
        success: function (a) {
            console.debug("post:" + postStr);
        },
        error: function (a) {
            console.debug("status : " + a.status);
            console.debug("message : " + a.responseText);
            createConsoleStrOnly("Post error.");
        }
    };
    $("#inputText").val("");
    createOutputStr(d);
    $.ajax(options); // 送信

}

// 前回のラブライブ！
function doLm15() {
    var lm15words = [
        "ワーッハッハッハッハ！！",
        "（ｶﾞﾁﾝ!!）",
        "（グビグビグビグビ……）",
        "（ﾀﾞﾝ!!）",
        "前回のラブライブ！"
    ];
    var str1 = lm15words[Math.floor(Math.random() * lm15words.length)];
    var str2 = lm15words[Math.floor(Math.random() * lm15words.length)];
    var str3 = lm15words[Math.floor(Math.random() * lm15words.length)];
    var str4 = lm15words[Math.floor(Math.random() * lm15words.length)];
    var str5 = lm15words[Math.floor(Math.random() * lm15words.length)];

    return str1 + str2 + str3 + str4 + str5;
}

// ここで初回表示時の認証状態を判定する。
function judgeAuth() {
    chrome.storage.sync.get(['accessToken', 'accessTokenSecret'], function (r) {
        if (r.accessToken === undefined) {
            console.debug("accessToken undefined");
            authInit();
            return;
        }
        if (r.accessTokenSecret === undefined) {
            console.debug("accessTokenSecret undefined");
            authInit();
            return;
        }
        // アクセストークンが存在
        twitterApiKey.accessToken = r.accessToken;
        twitterApiKey.accessTokenSecret = r.accessTokenSecret;
        $("#consoleText").html(_promStr);
    });
}

// outputStrに対してoutputStrとinputStrを組み合わせて出力
// DOS窓に対してEnter押した時の処理と同様
function createOutputStr(inputStr) {
    $("#outputText").html($(
            "#outputText").html() +
            $("#consoleText").html() + inputStr + "<br>"
            );
}

// 注意文言とか出す時
function createConsoleStrOnly(consoleText) {
    $("#outputText").html($(
            "#outputText").html() + consoleText + "<br>"
            );
}
