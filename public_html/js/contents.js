/* global OAuth */

// 定数定義
var OAUTH_TOKEN = "oauth_token=";
var OAUTH_TOKEN_SECRET = "oauth_token_secret=";
var PIN_STR = "[PIN]:";

var twitterApiKey = {
    "consumerKey": "JT7KQf8ChYIIYYiX2NVdJ4Dg5",
    "consumerSecret": "xO3yDjXva6C6tAm5ZHIkfzQU21tOS7O7MDD5eB78D6rlprwoAw",
    "accessToken": "",
    "accessTokenSecret": "",
    "requestToken": "",
    "requestTokenSecret": ""
};

$(document).ready(function () {

    // 認証状態判定
    judgeAuth();

    // キーボード押下時の処理
    $("#inputText").keyup(function (e) {
        if (e.keyCode === 13) {
            if ($("#consoleText").html() === PIN_STR) {
                authPinTxt($("#inputText").val());
                // 認証時のoutputTextはajaxのsuccessで行う。
            } else {
//                投稿文字列を一旦退避
                var postStr = $.trim($("#inputText").val());

//                一応これはデバッグ用
                if (postStr === '#clear') {
                    chrome.storage.sync.clear(function () {});
                    return;
                }
                $("#inputText").val("");
                doPost(postStr);
                $("#outputText").html(createOutputStr(postStr));
                $("#consoleText").html(">");
            }

        }
    });

//    フッター部フォーカス時の処理
    $("#footer").click(function () {
        // テキストボックスにフォーカスを切り替える
        $("#inputText").focus();
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

    // パラメータが7文字かつ数値でなければ無意味
    if (!(d.length === 7 || $.isNumeric(d))) {
        return;
    }

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
            oauth_token: twitterApiKey.requestToken,
            oauth_verifier: d
        }
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var target = OAuth.addToURL(message.action, message.parameters);

    var options = {
        type: message.method,
        url: target,
        success: function (d) {
            console.debug("accessToken:" + d);
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
            console.debug("accessToken:" + oauthToken);
            console.debug("accessTokenSecret:" + oauthTokenSecret);

            twitterApiKey.accessToken = oauthToken;
            twitterApiKey.accessTokenSecret = oauthTokenSecret;

            // 取得したすべてのキーをマップに詰める
            chrome.storage.sync.set(twitterApiKey, function () {});

            $("#outputText").html(createOutputStr($("#inputText").val()));
            $("#inputText").val("");
            $("#consoleText").html(">");
        },
        error: function (a) {
            console.debug("status : " + a.status);
            console.debug("message : " + a.responseText);
            createOutputStr($("#inputText").val());
            createConsoleStrOnly("Try again.");
            $("#inputText").val("");
        }
    };
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
            status: d
        }
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var target = OAuth.addToURL(message.action, message.parameters);

    var options = {
        type: message.method,
        url: target,
        success: function (d) {
            console.debug("post:" + d);
        },
        error: function (a) {
            console.debug("status : " + a.status);
            console.debug("message : " + a.responseText);
            createOutputStr(d);
            createConsoleStrOnly("Post error.");
        }
    };
    $("#inputText").val("");
    $.ajax(options); // 送信

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
        $("#consoleText").html(">");
    });
}

// outputStrに対してoutputStrとinputStrを組み合わせて出力
// DOS窓に対してEnter押した時の処理と同様
function createOutputStr(inputStr) {
    $("#outputText").html($(
            "#outputText").html() +
            createOutputTableStr($("#consoleText").html(), inputStr)
            );
}

// 注意文言とか出す時
function createConsoleStrOnly(consoleText) {
    $("#outputText").html($(
            "#outputText").html() +
            "<table id='inputTable'><tbody><tr><td id='prompt'>" +
            consoleText +
            "</td></tr></tbody></table>"
            );
}

// 出力用テーブル文字列を生成する。
function createOutputTableStr(consoleText, inputText) {
    return "<table id='inputTable'><tbody><tr><td id='prompt'>" +
            consoleText +
            "</td><td>" +
            inputText +
            "</td></tr></tbody></table>";
}