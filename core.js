//WINDOW CONTANTS
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

//Block constants
const BLOCK_WIDTH =  80;
const BLOCK_HEIGHT = 30;

//Ball Constants
const BALL_RADIUS = 15;
const BALL_VELOCITY = 400;
const BALL_START_X = GAME_WIDTH/2;
const BALL_START_Y = GAME_HEIGHT - BALL_RADIUS*2;

//Pad constants
const PAD_WIDTH = 150;
const PAD_HEIGHT = 25;
const PAD_START_X = GAME_WIDTH/2 - PAD_WIDTH/2;
const PAD_START_Y = GAME_HEIGHT - PAD_HEIGHT;
const PAD_SPEED = 350;

//KEY CONSTANTS
const KEY_A = 65;
const KEY_B = 68;

//Abstract class
class Renderable{
    update(dt){}
    render(){}
}

class Game extends Renderable{
    constructor(){
        super();
        this.blocks = [];
        //create ball
        this.ball = new Ball(BALL_START_X,BALL_START_Y,BALL_RADIUS);
        //create game layout
        this.createLayout();
        //create pad     
        this.pad = new Pad(PAD_START_X,PAD_START_Y);

        this.showText = true;
        this.gameOver = false;
        this.lives = 3;
    }

    createLayout(){
        //Number of horizontal blocks
        const horizontalBlocks = GAME_WIDTH/BLOCK_WIDTH;
        //Number of vertical blocks random between 4 - 9 rows
        const verticalBlocks = Math.floor((Math.random() * 5 + 4));
        const dColor = 100/verticalBlocks;
        for(let y = 0; y < verticalBlocks;y++){
            const _color = color(y* dColor,50,100);
            for(let x = 0; x < horizontalBlocks  ; x++ ){
                this.blocks.push(new Block(x * BLOCK_WIDTH,y * BLOCK_HEIGHT,_color));
            }    
        }
    }
    
    enableCheats(){
        this.lives = 45;
        this.cheatsEnabled = true;
    }
    

    //handler for key press
    keyPressed(code){
        //SPACE KEY
        if(code === 32){
            if(this.gameOver){
                this.resetGame();
                return;
            }
            if(this.ball.attached){
               this.launchBall();
               this.showText = false;
            }
        }
    }
    
    resetGame(){
        this.blocks = [];
        //create ball
        this.ball = new Ball(BALL_START_X,BALL_START_Y,BALL_RADIUS);
        //create game layout
        this.createLayout();
        //create pad     
        this.pad = new Pad(PAD_START_X,PAD_START_Y);
       
        this.showText = true;
        this.gameOver = false;
        this.lives = 3;
        this.cheatsEnabled = false;
    }

    launchBall(){
        this.ball.attached = false;
        //generate angle between PI/4 and 3/4 PI 
        const angle = Math.floor((Math.random() * (3*PI/4))) + PI/4;
        this.ball.applyVelocityWithAngle(BALL_VELOCITY,-angle);
    }
    //UPDATE CYCLE
    //  HANDLE KEYBOARD
    //  HANDLE PHYSICS
    //  HANDLE COLLISIONS
    update(dt){
        //Exit update loop if game is already over
        if(this.gameOver) return;
        //Update pad position
        if(keyIsDown(KEY_A)){
            this.pad.x += -PAD_SPEED * dt;
        }
        if(keyIsDown(KEY_B)){
            this.pad.x += PAD_SPEED * dt;
        }
        //Contain pad between window region, prevent from going outside
        if(this.pad.x < 0 ) this.pad.x = 0;
        if(this.pad.x + this.pad.w > GAME_WIDTH) this.pad.x = GAME_WIDTH - this.pad.w;

        //Update ball position over time
        this.ball.update(dt);

        //HANDLE BALL OUTSIDE OF WINDOW
        if(this.ball.y - this.ball.w/2  > GAME_HEIGHT){
            if(this.cheatsEnabled){
                this.ball.y = GAME_HEIGHT - this.ball.w/2;
                this.ball.applyVelocity(0,this.ball.velocity.y * -2);
               // noLoop();
                return;
            }
            this.ball.reset();
            this.pad.x = PAD_START_X;
            this.pad.y = PAD_START_Y;
            this.ball.attach(this.pad);
            this.lives--;
            if(this.lives <= 0) {
                this.gameOver = true;
                return;
            }
        }
        //CHECK COLLISION BETWEEN BLOCKS AND BALL
        if(!this.showText){
            for(let i=0;i<this.blocks.length;i++){
                const block = this.blocks[i];
                const collision = block.collidesWithCircleObject(this.ball);
                if(collision){
                    const rx = block.x + block.w/2;
                    const ry = block.y + block.h/2;
                    const dx = this.ball.x - rx;
                    const dy = this.ball.y - ry;
                    const angle = Math.atan2(dy,dx);
                    const vx = BALL_VELOCITY * Math.cos(angle);
                    const vy = BALL_VELOCITY * Math.sin(angle);
                    //RESOLVE COLLISION VELOCITY
                    this.ball.setVelocity(vx,vy);
                    //REMOVE BLOCK FROM GAME
                    this.blocks.splice(i,1);
                    //EXIT FOR LOOP, NEEDED TO PREVENT ERRORS WHEN BLOCK IS REMOVED
                    break;                
                }
            }
            //Winning condition
            if(this.blocks.length === 0){
                this.gameOver = true;
                return;
            }
        }
      
        //CHECK PAD COLLISION WITH BALL
        if(!this.ball.attached){
            const collision =  this.pad.collidesWithCircleObject(this.ball);
            if(collision){
                    const rx = this.pad.x + this.pad.w/2;
                    const ry = this.pad.y + this.pad.h/2;
                    const dx = this.ball.x - rx;
                    const dy = this.ball.y - ry;
                    const angle = Math.atan2(dy,dx);
                    const vx = BALL_VELOCITY * Math.cos(angle);
                    const vy = BALL_VELOCITY * Math.sin(angle);
                    //RESOLVE COLLISION
                    this.ball.setVelocity(vx,vy);
            }
        }
        //MOVE BALL WITH PAD IF ATTACHED
        if(this.ball.attached){
            this.ball.attach(this.pad);
        }
    }

    //RENDER BLOCKS AND GAME OBJECTS
    //RENDER ORDER ALWAYS MATTERS
    //  BACKGROUND CLEAR FIRST
    //  RENDER BLOCKS
    //  RENDER PAD
    //  RENDER BALL
    //CHANGING RENDER ORDER WILL CAUSE STRANGE BEHAVIOUR, LIKE BALL BEHIND BLOCKS OR PADS
    render(){
        background(0,0,0);
        for(let block of this.blocks){
            block.render();
        }
        this.ball.render();
        this.pad.render();
        
        if(this.showText){
            fill(0,0,frameCount%100);
            textSize(50);
            textAlign(CENTER,CENTER)
            text("Press SPACE to begin",GAME_WIDTH/2,GAME_HEIGHT/2)
        }
        if(this.gameOver){
            if( this.lives <= 0 ){
                textSize(50);
                fill(0,0,100);
                textAlign(CENTER,CENTER)
                text("You loose SPACE to restart",GAME_WIDTH/2,GAME_HEIGHT/2)
            }else{              
                if(this.blocks.length === 0){
                textSize(50);
                fill(0,0,frameCount%100);
                textAlign(CENTER,CENTER)
                text("You WIN Congrats !!!",GAME_WIDTH/2,GAME_HEIGHT/2)
                }
            }
        }
        textSize(50);
        fill(0,100,50);
        //textAlign(LEFT,LEFT); 
        for(let i=0;i<this.lives;i++){
            const x = 50*(i%15);
            const y = Math.floor(i/15) * 50;
            text("❤",50 + x,y + 35);
        }
    }
}

//GAME OBJECTS HAS position(x,y) and size(w,h)
class GameObject extends Renderable{
    constructor(x,y,w,h){
        super();
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

//ALL COLLIDABLES ARE GAMEOBJECTS AND have methods to handle collision with ball
class Collidable extends GameObject {

    constructor(x,y,w,h){
        super(x,y,w,h);
    }

    collidesWithCircleObject(object){
        const cx = object.x;
        const cy = object.y;

        let testX = cx;
        let testY = cy;
        if(cx < this.x) testX = this.x;
        else if(cx > this.x + this.w) testX = this.x + this.w;
        if(cy < this.y) testY = this.y;
        else if(cy > this.y + this.h) testY = this.y + this.h;

        const dx = cx - testX;
        const dy = cy - testY;
        const distance = dx*dx + dy*dy;
        const rSqr = (object.w/2) ** 2;
        if(distance <= rSqr){
            return true 
        }
        return false;
    }

}
//PAD is collidable too
class Pad extends Collidable{
    constructor(x,y){
        super(x,y,PAD_WIDTH,PAD_HEIGHT);
    }
    render(){
        noStroke();
        fill(50,100,50);
        rect(this.x,this.y,this.w,this.h);
    }
}
//Ball is physics object since it has to update its position and velocity
class PhysicsObject extends GameObject{
    constructor(x,y,w,h){
        super(x,y,w,h);
        this.velocity = {x:0,y:0};
    }

    update(dt){
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
    }
    //add to current velocity
    applyVelocity(x,y){
        this.velocity.x += x;
        this.velocity.y += y;
    }
    //set current velocity
    setVelocity(x,y){
        this.velocity.x = x;
        this.velocity.y = y;
    }
    //apply velocity with given angle
    applyVelocityWithAngle(v,angle){
        this.velocity.x += v * Math.cos(angle);
        this.velocity.y += v * Math.sin(angle);
    }

}

class Ball extends PhysicsObject {
    constructor(x,y,r){
        super(x,y,r * 2,r * 2);
        this.attached = true;
    }
    render(){
        noStroke();
        fill(0,0,100);
        ellipse(this.x,this.y,this.w,this.h);
    }
    update(dt){
        super.update(dt);
        //contain ball between walls
        if(this.x < this.w/2 || this.x + this.w/2 > GAME_WIDTH) {
            if(this.x < this.w/2) this.x = this.w/2;
            if(this.x + this.w/2 > GAME_WIDTH) this.x = GAME_WIDTH - this.w/2; 
            this.applyVelocity(-this.velocity.x*2,0);
        }

        if(this.y < this.w/2) {
            if(this.y < this.w/2) this.y = this.w/2;
            this.applyVelocity(0,-this.velocity.y*2);
        }
    }
    //move ball with object (pad)
    attach(object){
        this.x = object.x + object.w / 2;
        this.y = object.y - this.w/2;
    }
    //reset ball
    reset(){
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.x = BALL_START_X;
        this.y = BALL_START_Y;
        this.attached = true;
    }
}

//Block is a collidable that contains custom color
class Block extends Collidable{
    constructor(x,y,color){
        super(x,y,BLOCK_WIDTH,BLOCK_HEIGHT)
        this.color = color;
    }
    render(){
        stroke(100,0,0);
        strokeWeight(2);
        fill(this.color);
        rect(this.x,this.y,this.w,this.h);
    }
}


let game;
//entry point
function setup(){
    //create canvas window
    createCanvas(GAME_WIDTH,GAME_HEIGHT);
    //use HSB color mode  --- https://es.wikipedia.org/wiki/Modelo_de_color_HSV
    colorMode(HSB, 100);
    //create game instance
    game = new Game();
}

function draw(){
    const dt = deltaTime/1000;
    game.update(dt);
    game.render();
}


function keyPressed() {
    game.keyPressed(keyCode);
}

function godMode(){
    game.enableCheats();
}
