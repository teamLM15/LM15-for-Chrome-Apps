chrome.app.runtime.onLaunched.addListener(function() {
  var screenWidth = screen.availWidth;
  var screenHeight = screen.availHeight;
  var width = 400;
  var height = 400;
 
  chrome.app.window.create("../LM15.html",{
    bounds: {
      width: width,
      height: height,
      left: 100/*Math.round((screenWidth - width)/2)*/,
      top: 100/*Math.round((screenHeight - height)/2)*/
    }/*,
  frame: "none"
  */
  });
});