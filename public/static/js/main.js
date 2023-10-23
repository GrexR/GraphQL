console.log("THIS RAN!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
import Dashboard from "../views/Dashboard.js";
import Login from "../views/Login.js";
import PostView from "../views/PostView.js";
import * as Helper from "./helper.js";

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);

    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};

export function navigateTo(url) {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        { path: "/login", view: Login },
        { path: "/", view: Dashboard, displayData: true},
        { path: "/posts/:id", view: PostView },
    ];

    // Test each route for potential match
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path))
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);
    let loggedIn = Helper.getJWT() != null;
    if (!loggedIn) {
        match = {
            route: routes[0],
            result: [location.pathname]
        };
    } else if (!match) {
        match = {
            route: routes[1],
            result: [location.pathname]
        };
    } else if (match && match.route.view === Login) {
        match.route = routes[1];
    }


    console.log(match.route);

    const view = new match.route.view(getParams(match));

    document.querySelector("#app").innerHTML = await view.getHtml();
    if (match.route.displayData) {
        Helper.displayUserData()
       // Helper.handleData()
    }
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[logout]")) {
            e.preventDefault();
            Helper.deleteJWT()
            navigateTo("login");
        } else if (e.target.matches("[loginSubmit]")) {
            e.preventDefault();
            let username = document.querySelector(".usernameInput").value; // or email
            let password = document.querySelector(".passwordInput").value;
            Helper.handleLogin(username, password);
        }
    });

    router();
});