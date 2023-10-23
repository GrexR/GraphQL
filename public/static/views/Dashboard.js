import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Dashboard");
        this.setBodyID("dashboardPage")
    }

    async getHtml() {
        return `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <div class="logout" logout>Logout</div>
        <div class="profileSection">
        <h1 class="profileTitle">Profile Stats:</h1>
        <div class="row">
        <div class="column">
            <div class="card" id="card1">
                <p>
                  <i class="fa fa-user"></i>
                  </p>
                <h3></h3>
                <p></p>
            </div>
        </div>
       
        <div class="column">
            <div class="card" id="card2">
                <p>
                      <i class="fa fa-user"></i>
                  </p>
                <h3></h3>
                <p></p>
            </div>
        </div>
       
        <div class="column">
            <div class="card" id="card3">
                <p>
                      <i class="fa fa-user"></i>
                  </p>
                <h3></h3>
                <p></p>
            </div>
        </div>
    </div>

        </div>
        <div class="graphSection"></div>
        <div class="MouseHover">Test!</div>
        `;
    }
}