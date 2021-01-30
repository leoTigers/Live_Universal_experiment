const GRID_SIZE = 7
const OBJECT_TYPE = Object.freeze({
    "SINGLE_ARROW":0,
    "TRIPLE_ARROW":1,
    "FIVE_ARROW":2,
    "ROTATING_ARROW":3,
    "INFINITE_ARROW":4,
    "RED_ORB":5,
    "BLUE_ORB":6,
    "REFRESH_ORB":7,
    "REFLECT":8
})

const MAX_FIVE_ARROW = 4
const MAX_ROT_ARROW = 3
const MAX_INF_ARROW = 1
const MAX_REFRESH = 1
const REFLECT_UNLOCK = true

const TOOLS = ["A1.png", "A3.png", "A5.png", "AR.png", "AI.png",
    "RO.png", "BO.png", "RF.png",
    "RE.png", "RC.png", "RAC.png"]

class Grid{
    constructor(grid=null, limits=null) {
        this.grid = grid ? grid : []
        this.limits = limits ? limits : [0, 0, 0, 0]
        if(!grid)
            this.randomize()
    }

    randomize(){
        for(let i=0;i<GRID_SIZE;i++){
            let tmp = []
            for(let j=0;j<GRID_SIZE;j++){
                let component
                [component, this.limits] = new Component().random(this.limits)
                tmp.push(component)
            }
            this.grid.push(tmp)
        }
    }

    update(){
        let tds = document.getElementById("exp").getElementsByTagName("td")
        for(let i = 0 ; i < GRID_SIZE*GRID_SIZE ; i++){
            tds[i].innerHTML = ""
            tds[i].appendChild(this.grid[Math.floor(i/GRID_SIZE)][i%GRID_SIZE].to_html())
        }
    }

    canAdd(object_type){
        switch (object_type) {
            case 2:
                if (this.limits[0] === MAX_FIVE_ARROW)
                    return false;
                break
            case 3:
                if (this.limits[1] === MAX_ROT_ARROW)
                    return false
                break
            case 4:
                if (this.limits[2] === MAX_INF_ARROW)
                    return false
                break
            case 7:
                if (this.limits[3] === MAX_REFRESH)
                    return false
                break
        }
        return true
    }

    updateLimits(row, col, tool){
        switch (this.grid[row][col].type) {
            case 2:
                this.limits[0]--;
                break
            case 3:
                this.limits[1]--;
                break
            case 4:
                this.limits[2]--;
                break
            case 7:
                this.limits[3]--;
                break
        }
        switch (tool) {
            case 2:
                this.limits[0]++;
                break
            case 3:
                this.limits[1]++;
                break
            case 4:
                this.limits[2]++;
                break
            case 7:
                this.limits[3]++;
                break
        }
    }

    simulate(){
        let movements = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]]
        // starting pos
        let x = -1, y = GRID_SIZE - 1;
        let cur_dir = 3;

        let end = false;
        let score = 0;

        for (let i = 0; i < GRID_SIZE; i++){
            for (let j = 0; j < GRID_SIZE; j++) {
                this.grid[i][j].refresh()
                this.grid[i][j].current_rotation = this.grid[i][j].rotation
            }
        }

        do {
            //move
            x += movements[cur_dir][0];
            y += movements[cur_dir][1];

            //check exit cond
            if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
                end = true;
            }
            else {
                switch (this.grid[y][x].type) {
                    case 0: case 1: case 2: case 4:
                        if(this.grid[y][x].isActive()){
                            this.grid[y][x].current_uses++;
                            cur_dir = this.grid[y][x].current_rotation
                        }
                        break
                    case 3:
                        cur_dir = this.grid[y][x].current_rotation
                        this.grid[y][x].current_rotation = (this.grid[y][x].current_rotation + 1) % 8
                        break
                    case 5:
                        score++
                        break
                    case 6:
                        score--;
                        break
                    case 7:
                        if(this.grid[y][x].isActive()){
                            for (let i = 0; i < GRID_SIZE; i++){
                                for (let j = 0; j < GRID_SIZE; j++) {
                                    this.grid[i][j].refresh()
                                }
                            }
                            this.grid[y][x].current_uses++;
                        }
                        break
                    case 8:
                        if(this.grid[y][x].isActive()){
                            if (cur_dir & 1)
                                cur_dir = (cur_dir + 4) % 8;
                            else if (cur_dir === 0)
                                cur_dir = 6;
                            else
                                cur_dir -= 2;
                            this.grid[y][x].current_uses++
                        }
                        break;
                }
            }
        } while (!end);
        return score
    }

    load_from_json(json){
        this.limits = json.limits
        this.grid = []
        for(let i=0;i<GRID_SIZE;i++){
            let tmp = []
            for(let j=0;j<GRID_SIZE;j++){
                let component = new Component(json.grid[i][j].type, json.grid[i][j].rotation)
                tmp.push(component)
            }
            this.grid.push(tmp)
        }
    }
}

class Component{
    constructor(type=0, rotation=0) {
        this.type = type
        this.rotation = rotation
        this.current_rotation = rotation
        this.current_uses = 0
    }

    refresh(){
        this.current_uses = 0
    }

    isActive(){
        switch (this.type){
            case OBJECT_TYPE.SINGLE_ARROW:
            case OBJECT_TYPE.REFRESH_ORB:
                return this.current_uses < 1
            case OBJECT_TYPE.REFLECT:
                return this.current_uses < 2
            case OBJECT_TYPE.TRIPLE_ARROW:
                return this.current_uses < 3
            case OBJECT_TYPE.FIVE_ARROW:
                return this.current_uses < 5
        }
        return true
    }
    random(limits){
        let good = false;
        let type;
        let base_stuff = [0, 1, 5, 6]
        do{
            type = base_stuff[Math.floor(Math.random()*4)]
            good = true
            switch (type) {
                case 2:
                    if (limits[0] === MAX_FIVE_ARROW)
                        good = false
                    else
                        limits[0]++
                    break
                case 3:
                    if (limits[1] === MAX_ROT_ARROW)
                        good = false
                    else
                        limits[1]++
                    break
                case 4:
                    if (limits[2] === MAX_INF_ARROW)
                        good = false
                    else
                        limits[2]++
                    break
                case 7:
                    if (limits[3] === MAX_REFRESH)
                        good = false
                    else
                        limits[3]++
                    break
            }
        }while(!good)
        this.type = type
        this.rotation = Math.floor(Math.random()*8)
        return [this, limits]
    }

    rotate(){
        this.rotation = (this.rotation + 1) % 8
    }

    rotateA(){
        this.rotation--;
        this.rotation = this.rotation < 0 ? 7 : this.rotation
    }

    to_html(){
        let img = document.createElement("img")
        img.src = "img/"+TOOLS[this.type]
        img.style = "transform:rotate("+(-135+45*this.rotation)+"deg);"
        return img
    }
}

let gr = new Grid()
let tool = OBJECT_TYPE.SINGLE_ARROW

$(function (){
    init_grid("exp")
    init_grid("exp_scores")
    gr.update()
    //gr.draw()
    console.log("Heelo")

    let items = document.getElementById("items")
    for(let i = 0 ; i < TOOLS.length ; i++){
        let td = document.createElement("td")
        let img = document.createElement("img")
        img.src = "img/"+TOOLS[i]
        td.appendChild(img)
        if(i === 0)
            td.classList.add("active")
        items.appendChild(td)
    }

    add_handlers()
    let score = gr.simulate()
    setScore(score)
    compute_expected()


    $("#items > td").on("mousedown", function (e){
        this.parentElement.children[tool].classList.remove("active");
        tool = this.cellIndex
        this.classList.add("active")
        compute_expected()
    });
    updateLimits();
    //updateTool();

    $("body").on("keydown", function (k){
        if(k.key === "ArrowRight"){
            document.getElementById("items").children[tool].classList.remove("active");
            tool = (tool+1)%11
            document.getElementById("items").children[tool].classList.add("active");
        }else if(k.key === "ArrowLeft"){
            document.getElementById("items").children[tool].classList.remove("active");
            tool = tool===0?10:tool-1
            document.getElementById("items").children[tool].classList.add("active");
        }
    })
});

function compute_expected(){
    let exp_scores = document.getElementById("exp_scores")
    let tds = exp_scores.getElementsByTagName("td")
    for(let i = 0; i < GRID_SIZE;i++){
        for(let j = 0 ; j < GRID_SIZE ; j++){
            let gri = new Grid()
            gri.load_from_json(JSON.parse(JSON.stringify(gr)))

            if(tool < 9){
                if(gri.canAdd(tool)){
                    gri.updateLimits(i, j, tool)
                    gri.grid[i][j].type = tool
                }
            }else{
                if(tool === 9){
                    gri.grid[i][j].rotate();
                }else{
                    gri.grid[i][j].rotateA();
                }
            }
            tds[i*GRID_SIZE+j].innerHTML = ""+gri.simulate()
        }
    }
}

function setScore(score){
    let score_span = document.getElementById("score")
    score_span.innerHTML = ""+score
}


function updateLimits(){
    let limitSpan = document.getElementById("limits")
    limitSpan.innerHTML = "<br/>Five use arrows : "+gr.limits[0]+"/"+MAX_FIVE_ARROW+
        "<br/>Rotating arrows : "+gr.limits[1]+"/"+MAX_ROT_ARROW+
        "<br/>Infinite arrow : "+gr.limits[2]+"/"+MAX_INF_ARROW+
        "<br/>Refresh orb : "+gr.limits[3]+"/"+MAX_REFRESH
}
/*
function updateTool(){
    let CT = document.getElementById("currentTool")
    CT.innerHTML = ""
    let img = document.createElement("img")
    img.src = "img/"+TOOLS[tool]
    CT.appendChild(img)
}*/

function add_handlers(){
    $("#exp > tr > td").on("mousedown",
        function (e){
            let col = this.cellIndex
            let row = this.parentElement.rowIndex
            console.log(row + "," + col)

            if(tool < 9){
                if(gr.canAdd(tool)){
                    gr.updateLimits(row, col, tool)
                    gr.grid[row][col].type = tool
                }
            }else{
                if(tool === 9){
                    gr.grid[row][col].rotate();
                }else{
                    gr.grid[row][col].rotateA();
                }
            }
            this.innerHTML = ""
            this.appendChild(gr.grid[row][col].to_html())
            let score = gr.simulate()
            setScore(score)
            updateLimits()
            compute_expected()
        });
}

function init_grid(table_id){
    let table = document.getElementById(table_id)
    for(let i=0;i<GRID_SIZE;i++){
        let tr = document.createElement("tr")
        for(let j=0;j<GRID_SIZE;j++){
            let td = document.createElement('td')
            tr.appendChild(td)
        }
        table.appendChild(tr)
    }
}

function export_base64(){
    document.getElementById("export_zone").value = btoa(JSON.stringify(gr))
}

function import_base64(){
    let b64 = atob(document.getElementById("import_zone").value)
    let g64 = JSON.parse(b64)
    gr.load_from_json(g64)
    gr.update()
    let score = gr.simulate()
    setScore(score)
}