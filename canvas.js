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

    draw(){
        let table = document.getElementById("exp")
        for(let i=0;i<GRID_SIZE;i++){
            let tr = document.createElement("tr")
            for(let j=0;j<GRID_SIZE;j++){
                let td = document.createElement('td')
                td.appendChild(this.grid[i][j].draw())
                tr.appendChild(td)
            }
            table.appendChild(tr)
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
        let score_span = document.getElementById("score")
        score_span.innerHTML = ""+score
    }
}

class Component{
    constructor() {
        this.type = 0
        this.rotation = 0
        this.current_rotation = 0
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
        do{
            type = Math.floor(Math.random()*9)
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
    draw(){
        let img = document.createElement("img")
        img.src = "img/"+TOOLS[this.type]
        img.style = "transform:rotate("+(-135+45*this.rotation)+"deg);"
        return img
    }
}

let gr = new Grid()
let tool = OBJECT_TYPE.SINGLE_ARROW

$(function (){
    gr.draw()
    console.log("Heelo")

    let items = document.getElementById("items")
    for(let i = 0 ; i < TOOLS.length ; i++){
        let td = document.createElement("td")
        let img = document.createElement("img")
        img.src = "img/"+TOOLS[i]
        td.appendChild(img)
        items.appendChild(td)
    }

    add_handlers()
    gr.simulate()

    $("#items > td").first()[0].style.background = "red";

    $("#items > td").on("mousedown", function (e){
        this.parentElement.children[tool].style.background = "limegreen";
        tool = this.cellIndex
        this.parentElement.children[tool].style.background = "red";
    });
    updateLimits();
    //updateTool();

    $("body").on("keydown", function (k){
        if(k.key === "ArrowRight"){
            document.getElementById("items").children[tool].style.background = "limegreen";
            tool = (tool+1)%11
            document.getElementById("items").children[tool].style.background = "red";
        }else if(k.key === "ArrowLeft"){
            document.getElementById("items").children[tool].style.background = "limegreen";
            tool = tool===0?10:tool-1
            document.getElementById("items").children[tool].style.background = "red";
        }
    })
});


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
            this.appendChild(gr.grid[row][col].draw())
            gr.simulate()
            updateLimits()
        });
}

function export_base64(){
    document.getElementById("export_zone").value = btoa(JSON.stringify(gr))
}

function import_base64(){
    let b64 = atob(document.getElementById("import_zone").value)
    let g64 = JSON.parse(b64)
    gr = new Grid(g64.grid, g64.limits);
    gr.draw()

    add_handlers()
}