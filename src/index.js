const { SentimentAnalyzer, WordTokenizer, PorterStemmer } = require('natural');

/// Stuff taken from natural.js
/// 
/// If you want to sentiment analyzer on "I love cakes" as in the example
/// first take the string "I love cakes" and run tokenizer.tokenize() on it to
/// convert it to ["I", "love", "cakes"]
/// Then, run analyzer.getSentiment() on it, which should return a value between
/// -5 and +5, higher is more positive. This example should yield 0.66
///
const tokenizer = new WordTokenizer();
const analyzer = new SentimentAnalyzer("English", PorterStemmer, "pattern");

////

/// The blocker plugin code:

console.log("Starting up extension....");

// chrome likes to put its logic under chrome and not browser, this here makes it
// cross-browser platform.
if (typeof browser === "undefined") {
    var browser = chrome;
}


/**
 * In order to make our logic function across social media sites and with different
 * content filtering algorithms, we architect our system as follows:
 * 
 * (1) Searching
 *     Scrapes the DOM for any social media posts (jQuery based on the url)
 *     and creates a class SocialMediaContent representing it.
 * 
 *     SocialMediaContent() should contain the HTML node, username and
 *     user id of the author, and anything else needed, so no one else needs
 *     to make messy jQuery stuff after this.
 * 
 * (2) Decision
 *     Uses Sentiment Analyzers or ML or username similarity checking against
 *     an offline list of usernames, to determine whether or not to block
 *     the post
 * 
 * (3) Action
 *     Based on the decision, this could allow the content to persist,
 *     remove it from the DOM, or blur it out with CSS
 */

/// This is the poster of a piece of content
/// It has a username and user id, so we can match the person across different id's/names across sites
/// that way, we can more easily block people across all of social media.
class SocialMediaAuthor {
    constructor(userId, userName) {
      this.userId = userId;
      this.userName = userName;
    }
}

/// This is a single piece of blockable content. Either it is removed or not
/// from your view.
/// Node is stored here so that we can remove it from the dom later.
class SocialMediaContent {
    constructor(author, content, node) {
      this.author = author;
      this.content = content;
      this.node = node;
    }
}

// Keep track of the ndoes checked, so we don't do too many checks
var nodesChecked = new Set();
/**
 * Decides if a particular SocialMediaContent post should be filtered or allowed, and takes appropriate action
 * 
 * @param {SocialMediaContent} smContent 
 * @returns 
 */
function shouldBlockPost(smContent) {
    (async () => {
        if (nodesChecked.has(smContent.node)) {
            // Already checked
            return;
        }
        const sentiment = analyzer.getSentiment(tokenizer.tokenize(smContent.content));
        const shouldBlock = sentiment <= 0.1;
        if (shouldBlock) {
            console.log("Blocking post (" + sentiment + ") by " + smContent.author.userName + " and userId " + smContent.author.userId + " Content: " + smContent.content);
            //smContent.node.remove();
            smContent.node.style.filter = 'blur(2px)';
        } else {
            nodesChecked.add(smContent.node);
            console.log("Allowing post (" + sentiment + ") by " + smContent.author.userName + " and userId " + smContent.author.userId + " Content: " + smContent.content);
        }
      })();
  return true;
}

/**
 * findAllPosts returns an array of all SocialMediaContent on the page. It should have variations based on the website being viewed.
 * @returns 
 */
function findAllPosts() {
    const url = window.location.host;
    if (url.includes("facebook.com")) {
        console.log("Facebook detected, returning all posts");
        // it's facebook
        return findAllPostsFacebook();
    }
    return [];
}

/**
 * findAllPostsFacebook is the findAllPosts implementation for Facebook
 * @returns 
 */
function findAllPostsFacebook() {
    const potentialPosts = document.querySelectorAll("body div div div div div div div div div div div div div div div div div div div div");

    var myPosts = [];
    
    document.querySelectorAll("body div div div div div div div div div div div div div div div div div div div div").forEach((item) => {
        const posterHeader = item.querySelector("span h4");
        const poster = item.querySelector("span h4 span a strong span");
        const altPoster = item.querySelector("span h4 div span a strong span");
        if (posterHeader || poster || altPoster) {
            myPosts.push(item);
        }
    });
    
    var results = [];
    myPosts.forEach((item) => {
        const posterHeader = item.querySelector("span h4, span h3");
        if (posterHeader) {
            const posterLink = posterHeader.querySelector("a");
            const posterName = posterHeader.querySelector("strong span");
    
            var userId = '';
            var userName = '';
            var content = '';

            // Try to extract the user id or group id
            if (posterLink) {
                const hrefLink = posterLink.href;
                const userIdStart = hrefLink.search("facebook.com\\/") + "facebook.com/".length;
                const userIdEnd =  hrefLink.search("\\?");
                userId = hrefLink.substring(userIdStart, userIdEnd);
            }
    
            // Try to extract the user name or group name
            if (posterName) {
                userName = posterName.textContent;
            } else {
                const groupName = posterHeader.querySelector("a span");
                if (groupName) {
                    userName = groupName.textContent;
                }
            }
            var author = new SocialMediaAuthor(userId, userName);

            // Try to get content 
            const contentNode = item.querySelectorAll("span div div");
            contentNode.forEach((contentItem) => {
               const contentText = contentItem.textContent; 
               // Facebook puts all content in textAlign:start
               if (contentItem.style.textAlign === 'start') {
                //console.log(contentItem);
                if (contentText) {
                 content = content + "\n" + contentText;
                 //console.log(content);
                }
                }
            });

            results.push(new SocialMediaContent(author, content, item));
            //console.log("User name: " + userName + " and userId " + userId);
        }
    });
    return results;
}

/// --------------------------------------------------------------------------------------------------
/// Execution 
/// --------------------------------------------------------------------------------------------------
/// Every 1000ms, do the following:
/// 1. Find all posts
/// 2. Decide if we want to keep it or block it
/// 3. Block the post if so
function runBlocker() {
    var results = findAllPosts();
    // For each post, check if we should allow or block it, and if block, then remove it from the dom
    results.forEach((result) => {
        shouldBlockPost(result);
    });
}

// TODO: In the future, trigger scanning on load or on other stuff, instead of just running a 1s timer
setInterval(runBlocker, 1000);
