import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js'; 
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';

//This project recreates Hunor Marton Borbely's game from scratch, adding some new features as well.
//For more info about the Hunor Marton Borbely access the link below
//https://www.youtube.com/watch?v=JhgBwJn1bQw&ab_channel=HunorM%C3%A1rtonBorb%C3%A9ly 

window.focus(); // Capture keys right away (by default focus is on editor)

//Setting up the camera variables
var aspectRatio = window.innerWidth / window.innerHeight;
var cameraWidth = 1200;
var cameraHeight = cameraWidth / aspectRatio;

//Setting up variables and Calculating the radius and angles for the Street and Grass
var streetRadius = 230;
var streetWidth = 45;
var insideStreetRadius = streetRadius - streetWidth;
var outsideStreetRadius = streetRadius + streetWidth;

var angle1 = (1/3) * Math.PI; //meaning an angle of 60 degrees

var deltaY = Math.sin(angle1) * insideStreetRadius; //get the value to calculate the 2nd angle
var angle2 = Math.asin(deltaY / outsideStreetRadius);

var arcCentreX =
(
    Math.cos(angle1) * insideStreetRadius + Math.cos(angle2) * outsideStreetRadius
) / 2;

var angle3 = Math.acos(arcCentreX / insideStreetRadius);

var angle4 = Math.acos(arcCentreX / outsideStreetRadius);

//Setting up variables for the game mechanics
var ready;
var movedUserAngle;
var initialUserAngle = Math.PI;
var score;
var speed = 0.0017;
var scoreElement = document.getElementById("score");
const endElement = document.getElementById("end");
const infoElement = document.getElementById("info");
let AiVehicles = [];
var previousTimestamp;
var accelerate = false;
var brake = false;

// Using OrthographicCamera as in this perspective the object's size in the rendered image stays constant regardless of its distance from the camera
console.log("Create the orthographic perspective camera");
var camera = new THREE.OrthographicCamera( cameraWidth / -2, //left
cameraWidth / 2, //right
cameraHeight / 2, //top
cameraHeight / -2 ,//bottom
0, //near plane
1000 //far plane
);
camera.position.set(0, -220, 300);
camera.lookAt(0, 0, 0);

//scene
console.log("Create the scene");
var scene = new THREE.Scene();

//User car
var userCar = Car();
scene.add(userCar);

//Trees
console.log("Add trees");
var tree1 = Tree();
tree1.position.x = arcCentreX * 1.3;
scene.add(tree1);

var tree2 = Tree();
tree2.position.x = arcCentreX * 1.3;
tree2.position.y = arcCentreX * 0.5;
scene.add(tree2);

var tree3 = Tree();
tree3.position.x = arcCentreX * 1.6;
tree3.position.y = arcCentreX * 0.2;
scene.add(tree3);

var tree4 = Tree();
tree4.position.x = -arcCentreX * 1.3;
tree4.position.y = -arcCentreX * 0.5;
scene.add(tree4);

var tree5 = Tree();
tree5.position.x = -arcCentreX * 1.6;
tree5.position.y = -arcCentreX * 0.2;
scene.add(tree5);

var tree6 = Tree();
tree6.position.x = -arcCentreX * 1.3;
scene.add(tree6);

var tree7 = Tree();
tree7.position.x = arcCentreX * 0.5;
tree7.position.y = arcCentreX * 1.75;
scene.add(tree7);

var tree8 = Tree();
tree8.position.x = -arcCentreX * 0.5;
tree8.position.y = arcCentreX * 1.75;
scene.add(tree8);

var tree9 = Tree();
tree9.position.x = -arcCentreX * 1;
tree9.position.y = -arcCentreX * 2.2;
scene.add(tree9);

var tree10 = Tree();
tree10.position.x = arcCentreX * 2;
tree10.position.y = -arcCentreX * 2;
scene.add(tree10);

var tree11 = Tree();
tree11.position.x = arcCentreX * 0.5;
tree11.position.y = -arcCentreX * 2;
scene.add(tree11);

var tree12 = Tree();
tree12.position.x = arcCentreX * 3;
tree12.position.y = -arcCentreX * 0.5;
scene.add(tree12);

var tree13 = Tree();
tree13.position.x = -arcCentreX * 3;
tree13.position.y = arcCentreX * 0.5;
scene.add(tree13);

//Houses
console.log("Add houses");
var house1 = House();
house1.position.x = -arcCentreX * 2.3;
house1.position.y = arcCentreX * 1.8;
house1.rotation.z = 0.5;
scene.add(house1);

var house2 = House();
house2.position.x = arcCentreX * 2;
house2.position.y = arcCentreX * 1.8;
house2.rotation.z = -0.5;
scene.add(house2);

//Stop Sign
var stop = StopSign();
scene.add(stop);

renderMap(cameraWidth, cameraHeight * 2); //Width and Height parameters defining the size of the map

//Setting up the lightning
console.log("Add the ambient light");
var lightAmbient = new THREE.AmbientLight(0xffffff, 0.6); 
scene.add(lightAmbient);

console.log("Adding directional light");
var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 400);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 512;
dirLight.shadow.mapSize.height = 512;
dirLight.shadow.camera.left = -400;
dirLight.shadow.camera.right = 350;
dirLight.shadow.camera.top = 400;
dirLight.shadow.camera.bottom = -300;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = 800;
scene.add(dirLight);

//Set up renderer
console.log("Create the renderer");
// added antialias to address the rough edges
// added powerPreference to make sure that it can be played even on old devices with less ram 
var renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: "high-performance"});  
renderer.setSize(window.innerWidth, window.innerHeight); 
document.body.appendChild(renderer.domElement);
// Rendering shadow
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap

reset();

//Setting up camera controller
 console.log("Create the camera controller");
 var controls = new OrbitControls(camera, renderer.domElement);
 controls.enableDamping = true;
 controls.dampingFactor = 0.75;
 controls.screenSpacePanning = false;
 controls.enabled = false;

//Getting the street line markings
function getStreetMarkings(streetWidth, streetHeight){
    var canvas = document.createElement("canvas");
    canvas.width = streetWidth;
    canvas.height = streetHeight;
    var context = canvas.getContext("2d");

    context.fillStyle = "#5c5c5c";
    context.fillRect(0, 0, streetWidth, streetHeight);

    context.lineWidth = 2;
    context.strokeStyle = "#f1efef";
    context.setLineDash([10, 14]);

    //Left Circle
    context.beginPath();
    context.arc(
        streetWidth / 2 - arcCentreX,
        streetHeight / 2,
        streetRadius,
        0,
        Math.PI * 2
    );
    context.stroke();

    //Right Circle
    context.beginPath();
    context.arc(
        streetWidth / 2 + arcCentreX,
        streetHeight / 2,
        streetRadius,
        0,
        Math.PI * 2
    );
    context.stroke();

    return new THREE.CanvasTexture(canvas);
}

//Getting the grass portion inside the Street circles
//Using absarc for the absolute position of the arc
function getLeftGrass(){
    var grassLeft = new  THREE.Shape();

    grassLeft.absarc(
        -arcCentreX,   //centre
        0,
        insideStreetRadius,  //radius
        angle1,  //angles
        -angle1,
        false  //clockwise
    );

    grassLeft.absarc(
        arcCentreX,
        0,
        outsideStreetRadius,
        Math.PI + angle2,
        Math.PI - angle2,
        true
    ); 

    return grassLeft;
}

function getMiddleGrass(){
    var grassMiddle = new  THREE.Shape();

    grassMiddle.absarc(
        -arcCentreX,
        0,
        insideStreetRadius,
        angle3,
        -angle3,
        true
    );

    grassMiddle.absarc(
        arcCentreX,
        0,
        insideStreetRadius,
        Math.PI + angle3,
        Math.PI - angle3,
        true
    ); 

    return grassMiddle;
}

function getRightGrass(){
    var grassRight = new  THREE.Shape();

    grassRight.absarc(
        arcCentreX,
        0,
        insideStreetRadius,
        Math.PI - angle1,
        Math.PI + angle1,
        true
    );

    grassRight.absarc(
        -arcCentreX,
        0,
        outsideStreetRadius,
        -angle2,
        angle2,
        false
    ); 

    return grassRight;
}

function getExteriorGrass(streetWidth, streetHeight){
    var exterior = new  THREE.Shape();

    exterior.moveTo(-streetWidth / 2, -streetHeight /2);
    exterior.lineTo(0, -streetHeight / 2);

    exterior.absarc(
        -arcCentreX,
        0,
        outsideStreetRadius,
        -angle4,
        angle4,
        true
    );

    exterior.absarc(
        arcCentreX,
        0,
        outsideStreetRadius,
        Math.PI - angle4,
        Math.PI + angle4,
        true
    ); 

    exterior.lineTo(0, -streetHeight / 2);
    exterior.lineTo(streetWidth / 2, -streetHeight / 2);
    exterior.lineTo(streetWidth / 2, streetHeight / 2);
    exterior.lineTo(-streetWidth / 2, streetHeight / 2);

    return exterior;
}

function renderMap(streetWidth, streetHeight) {
    //line marking on the street
    var lineTexture = getStreetMarkings(streetWidth, streetHeight);

    //Using PlaneBufferGeometry as it is the low memory alternative to the PlaneGeometry
    //Using MeshLambertMaterial as it is a material for non-shiny surfaces
    var trackGeometry = new THREE.PlaneBufferGeometry(streetWidth, streetHeight);
    var trackMaterial = new THREE.MeshLambertMaterial({map: lineTexture}); //mapping lineTextures to the terrain Material
    var track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.receiveShadow = true;
    scene.add(track);

    //Using extruded geometry to create a 3D mesh from a 2D shape
    var grassLeft = getLeftGrass();
    var grassRight = getRightGrass();
    var grassMiddle = getMiddleGrass();
    var grassExterior = getExteriorGrass(streetWidth, streetHeight);

    var fieldGeometry = new THREE.ExtrudeBufferGeometry([grassLeft, grassMiddle, grassRight, grassExterior],
        {depth: 6, bevelEnabled: false}
        );

        var fieldMesh = new THREE.Mesh(fieldGeometry, [
            new THREE.MeshLambertMaterial({color: 0x66bf40}),
            new THREE.MeshLambertMaterial({color: 0x23311c})
        ]);
        fieldMesh.receiveShadow = true;
        scene.add(fieldMesh);
        console.log("Rendering the map");
}

//Defining the tree function
function Tree() {
    var tree = new THREE.Group();

    var treeTrunkGeometry = new THREE.BoxBufferGeometry(15, 15, 30);
    var treeTrunkMaterial = new THREE.MeshLambertMaterial({color: 0x4b3f2f});
    var treeCrownMaterial = new THREE.MeshLambertMaterial({color: 0x498c2c});

    var trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
    trunk.position.z = 10;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
  
    var height = 60;
    
    var crown = new THREE.Mesh(
      new THREE.SphereGeometry(height / 2, 30, 30),
      treeCrownMaterial
    );
    crown.position.z = height / 2 + 30;
    crown.castShadow = true;
    crown.receiveShadow = false;
    tree.add(crown);
  
    return tree;
  }

  //Defining the house function
  function House() {
    var house = new THREE.Group();

    var houseWallGeometry = new THREE.BoxBufferGeometry(40, 30, 40);
    var houseWallMaterial = new THREE.MeshLambertMaterial({color: 0xac8e82});
    var houseRoofGeometry = new THREE.ConeBufferGeometry(30 , 20, 4);
    var houseRoofMaterial = new THREE.MeshLambertMaterial({color: 0xb35f45});
    var houseDoorGeometry = new THREE.PlaneBufferGeometry(20, 20);
    var houseDoorMaterial = new THREE.MeshLambertMaterial({color: 0xd2042d});

    var wall = new THREE.Mesh(houseWallGeometry, houseWallMaterial);
    wall.position.z = 20;
    wall.castShadow = true;
    wall.receiveShadow = false;
    house.add(wall);

    var roof = new THREE.Mesh(houseRoofGeometry, houseRoofMaterial);
    roof.rotation.y = Math.PI * 0.25;
    roof.position.y = 2.5 + 0.5;
    roof.rotation.x= 1.55;
    roof.position.z = 50;
    roof.castShadow = true;
    roof.receiveShadow = false;
    house.add(roof);

    var door = new THREE.Mesh(houseDoorGeometry, houseDoorMaterial);
    door.position.z = 17;
    door.position.y = -18;
    door.rotation.x= 1.6;
    door.castShadow = true;
    door.receiveShadow = false;
    house.add(door);

    var bushGeometry = new THREE.SphereBufferGeometry(10, 36, 36);
    var bushMaterial = new THREE.MeshLambertMaterial({color: 0x498c2c});

    var bush1 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush1.scale.set(0.5, 0.5, 0.5);
    bush1.position.set(10, -18, 10);
    house.add(bush1);

    var bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush2.scale.set(0.25, 0.25, 0.25);
    bush2.position.set(4, -18, 8);
    house.add(bush2);

    var bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush3.scale.set(0.4, 0.4, 0.4);
    bush3.position.set(- 10, -18, 9);
    house.add(bush3);

    var bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush4.scale.set(0.15, 0.15, 0.15);
    bush4.position.set(- 5, -18, 7);
    house.add(bush4);

    return house;
  }

  function StopSign(){
    var sign = new THREE.Group()


    var signTexture = new THREE.TextureLoader().load( './assets/sign.png' );

    var signGeometry = new THREE.CircleGeometry(20, 32);
    var signMaterial = new THREE.MeshLambertMaterial( { map: signTexture } );
    var poleGeometry = new THREE.CylinderGeometry( 2, 2, 30, 32 );
    var poleMaterial = new THREE.MeshLambertMaterial({color: 0x808080});

    var stopSign = new THREE.Mesh(signGeometry, signMaterial);
    stopSign.position.z = 50;
    stopSign.rotation.x = 1.2;
    stopSign.castShadow = true;
    stopSign.receiveShadow = false;
    sign.add(stopSign);

    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.z = 15;
    pole.rotation.x = 1.55;
    pole.castShadow = true;
    pole.receiveShadow = false;
    sign.add(pole);

    return sign;
  }

//Drawing windshield textures on canvas
function getFrontWindshieldTexture()
{
    var canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    var context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 64, 32);

    context.fillStyle = "#666666";
    context.fillRect(8, 8, 48, 24);

    return new THREE.CanvasTexture(canvas);
}

function getSideWindshieldTexture()
{
    var canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 32;
    var context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 128, 32);

    context.fillStyle = "#666666";
    context.fillRect(10, 8, 38, 24);
    context.fillRect(58, 8, 60, 24);

    return new THREE.CanvasTexture(canvas);
}

//Choose random value from the array
function randomValue(array){
    return array[Math.floor(Math.random() * array.length)];
}

function Car()
{
    //Defining car as a group in order to group individual car parts under the same variable. 
    var car = new THREE.Group();  
    console.log("Create car parts");

    //Creating a variable to later randomise the car's colour
    const carColours = [0xa41613, 0xbdb638, 0x67a338, 0x851cce, 0xff7af1];

    //Creating car parts(Wheels, body, windshield)
    var backWheels = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12, 33, 12),
        new THREE.MeshLambertMaterial({color: 0x333333})
    );
    backWheels.position.z = 6;
    backWheels.position.x = -18;
    backWheels.castShadow = false;
    backWheels.receiveShadow = false;
    car.add(backWheels);

    var frontWheels = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12, 33, 12),
        new THREE.MeshLambertMaterial({color: 0x333333})
    );
    frontWheels.position.z = 6;
    frontWheels.position.x = 18;
    frontWheels.castShadow = false;
    frontWheels.receiveShadow = false;
    car.add(frontWheels);

    console.log("Assign random car colour");
    var body = new THREE.Mesh(
        new THREE.BoxBufferGeometry(60, 30, 15),
        new THREE.MeshLambertMaterial({color: randomValue(carColours)})
    );
    body.position.z =12;
    body.castShadow = true;
    body.receiveShadow = true;
    car.add(body);

    var frontWindshieldTexture = getFrontWindshieldTexture();
    frontWindshieldTexture.center = new THREE.Vector2(0.5, 0.5);
    frontWindshieldTexture.rotation = Math.PI / 2;

    var backWindshieldTexture = getFrontWindshieldTexture();
    backWindshieldTexture.center = new THREE.Vector2(0.5, 0.5);
    backWindshieldTexture.rotation = -Math.PI / 2;

    var leftWindshieldTexture = getSideWindshieldTexture();
    leftWindshieldTexture.flipY = false;

    var rightWindshieldTexture = getSideWindshieldTexture();

    var windshield = new THREE.Mesh(
        new THREE.BoxBufferGeometry(33, 24, 12),
        [
            new THREE.MeshLambertMaterial({map: frontWindshieldTexture}),
            new THREE.MeshLambertMaterial({map: backWindshieldTexture}),
            new THREE.MeshLambertMaterial({map: leftWindshieldTexture}),
            new THREE.MeshLambertMaterial({map: rightWindshieldTexture}),
            new THREE.MeshLambertMaterial({color: 0xffffff}), //top
            new THREE.MeshLambertMaterial({color: 0xffffff}), //bottom
        ]    
    );
    windshield.position.x = -6;
    windshield.position.z = 25.5;
    windshield.castShadow = true;
    windshield.receiveShadow = true;
    car.add(windshield);

//Uncomment to make Hit Boxes visible + see Reset() and hitDetection()
    // car.hitBox1 = HitBox();
    // car.hitBox2 = HitBox();

    console.log("Add the car");
    return car;
} 

function Jeep() {
    var jeep = new THREE.Group();
    console.log("Create jeep parts");
    const jeepColours = [0xeb5a00, 0x0019b3, 0xf81fff];
    
  
    //Creating car parts(Wheels, body, windshield)
    var backWheels = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12, 36, 15),
        new THREE.MeshLambertMaterial({color: 0x333333})
    );
    backWheels.position.z = 6;
    backWheels.position.x = -22;
    backWheels.castShadow = true;
    backWheels.receiveShadow = true;
    jeep.add(backWheels);

    var frontWheels = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12, 36, 15),
        new THREE.MeshLambertMaterial({color: 0x333333})
    );
    frontWheels.position.z = 6;
    frontWheels.position.x = 22;
    frontWheels.castShadow = true;
    frontWheels.receiveShadow = true;
    jeep.add(frontWheels);

    console.log("Assign random jeep colour");
    var body = new THREE.Mesh(
        new THREE.BoxBufferGeometry(75, 33, 20),
        new THREE.MeshLambertMaterial({color: randomValue(jeepColours)})
    );
    body.position.z =20;
    body.castShadow = true;
    body.receiveShadow = true;
    jeep.add(body);

    var frontWindshieldTexture = getFrontWindshieldTexture();
    frontWindshieldTexture.center = new THREE.Vector2(0.5, 0.5);
    frontWindshieldTexture.rotation = Math.PI / 2;

    var backWindshieldTexture = getFrontWindshieldTexture();
    backWindshieldTexture.center = new THREE.Vector2(0.5, 0.5);
    backWindshieldTexture.rotation = -Math.PI / 2;

    var leftWindshieldTexture = getSideWindshieldTexture();
    leftWindshieldTexture.flipY = false;

    var rightWindshieldTexture = getSideWindshieldTexture();

    var windshield = new THREE.Mesh(
        new THREE.BoxBufferGeometry(50, 26, 16),
        [
            new THREE.MeshLambertMaterial({map: frontWindshieldTexture}),
            new THREE.MeshLambertMaterial({map: backWindshieldTexture}),
            new THREE.MeshLambertMaterial({map: leftWindshieldTexture}),
            new THREE.MeshLambertMaterial({map: rightWindshieldTexture}),
            new THREE.MeshLambertMaterial({color: 0xffffff}), //top
            new THREE.MeshLambertMaterial({color: 0xffffff}), //bottom
        ]    
    );
    windshield.position.x = -8;
    windshield.position.z = 35;
    windshield.castShadow = true;
    windshield.receiveShadow = true;
    jeep.add(windshield);

//Uncomment to make Hit Boxes visible + see Reset() and hitDetection()
    // jeep.hitBox1 = HitBox();
    // jeep.hitBox2 = HitBox();

    console.log("Add the jeep");
    return jeep;
  }


//Actions for when the key is pressed
window.addEventListener("keydown", function(event){ 
    if(event.key == "w" || event.key == "W"){
    startGame();
    accelerate = true;
    return;
    }
    
    if(event.key == "s" || event.key == "S"){
        brake = true;
        return;
        }
    
    if(event.key == "r" || event.key == "R"){
        reset();
        console.log("Reset Game");
        return;
        } 
       
        //enable disable camera controls
    if(event.key == "o" || event.key == "O"){
        if(controls.enabled){
            camera.position.set(0, -220, 300);
            camera.lookAt(0, 0, 0);
            camera.zoom = 1;
            camera.updateProjectionMatrix ();
            controls.enabled = false;
            }else{ controls.enabled = true;}
    }

        //enable disable night setting
    if(event.key == "n" || event.key == "N"){
        if(lightAmbient.intensity == 0.6){
            lightAmbient.intensity = 0;
            dirLight.intensity = 0.3;
                    }else{
                        lightAmbient.intensity = 0.6;
                        dirLight.intensity = 0.6;
                        }
    }
    });
    
    //Actions for when the key is released
    window.addEventListener("keyup", function(event){ 
        if(event.key == "w" || event.key == "W"){
        accelerate = false;
        return;
        }
    
        if(event.key == "s" || event.key == "S"){
            brake = false;
            return;
            }
    });

//Reset function serves for both reset and initialisation
function reset()
{
//Resseting position and score
movedUserAngle = 0;
score = "Score: 0";

//Delete AI vehicles
AiVehicles.forEach((vehicle) =>
{
scene.remove(vehicle.mesh);

//Delete Hit Boxes if active
// if (vehicle.mesh.hitBox1)
// scene.remove(vehicle.mesh.hitBox1);
// if (vehicle.mesh.hitBox2)
// scene.remove(vehicle.mesh.hitBox2);

});

AiVehicles = [];

endElement.style.display = "none";

scoreElement.innerText = score;
previousTimestamp = undefined;
moveUserCar(0); //Move user's car to the initial position

renderer.render(scene, camera);
ready = true;
}

function startGame()
{
    if(ready){
        console.log("Start Game");    
        infoElement.style.opacity = 0;
        ready = false;
        renderer.setAnimationLoop(animate); //Looping the animate function
    }
}

function getUserSpeed(){
    if (accelerate){ 
        return speed * 2;
    }
        
    if(brake){
        return speed * 0.5;
    }
    return speed;
}

    //Defining an angle to tell where the car should be around the circle
    //This angle will help calculate te x and y positions
function moveUserCar(timeDelta){
    var userSpeed = getUserSpeed();
    movedUserAngle -= userSpeed * timeDelta;

    var totalUserAngle = initialUserAngle + movedUserAngle;

    var userX = Math.cos(totalUserAngle) * streetRadius - arcCentreX;
    var userY = Math.sin(totalUserAngle) * streetRadius;

    userCar.position.x = userX;
    userCar.position.y = userY;

    userCar.rotation.z = totalUserAngle - Math.PI / 2;
}

function getAiSpeed(type){
    if (type == "car"){
        var minSpeed = 1;
        var maxSpeed = 2;
        console.log("Assign random AI Speed");
        return minSpeed + Math.random() * (maxSpeed - minSpeed);
    }
    if (type == "jeep"){
        var minSpeed = 0.75;
        var maxSpeed = 1.2;
        console.log("Assign random AI Speed");
        return minSpeed + Math.random() * (maxSpeed - minSpeed);
    }
}

function addAiVehicle(){
    var vehicleType = ["car", "jeep"];

    var type = randomValue(vehicleType);
    var speed = getAiSpeed(type);

    //generate a random no between 1 and 0, then check if it's more then half
    var clockwise = Math.random() >= 0.5;
    var angle = clockwise ? Math.PI / 2 : -Math.PI / 2;  //if clockwise, car starts top of street (90 degrees), otherwise bottom of the street

    var mesh = type == "car" ? Car() : Jeep();

    scene.add(mesh);

    AiVehicles.push({ mesh, type, speed, clockwise, angle });
}

//Simillar to moving user's car
function moveAiVehicles(timeDelta){
    AiVehicles.forEach((vehicle) => {
        if(vehicle.clockwise){
            vehicle.angle -= speed * timeDelta * vehicle.speed;
        }else{
            vehicle.angle += speed * timeDelta * vehicle.speed;
        }

        var vehicleX = Math.cos(vehicle.angle) * streetRadius + arcCentreX;
        var vehicleY = Math.sin(vehicle.angle) * streetRadius;
        var rotation = vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);

        vehicle.mesh.position.x = vehicleX;
        vehicle.mesh.position.y = vehicleY;
        vehicle.mesh.rotation.z = rotation;
    });   
}

//function that can be used to make the Hit Boxes visible
function HitBox() {
    const hitBox = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 50, 30),
      new THREE.MeshLambertMaterial({ color: 0x1520a6 })
    );
    hitBox.position.z = 25;
    hitBox.rotation.x = Math.PI / 2;
  
    scene.add(hitBox);
    return hitBox;
  }

function getHitBox(center, angle, clockwise, distance){
    var directionAngle = angle + clockwise ? -Math.PI / 2 : +Math.PI / 2;
    return {
      x: center.x + Math.cos(directionAngle) * distance,
      y: center.y + Math.sin(directionAngle) * distance
    };
}

//Basic hit detection
//Sometimes it will trigger even if the cars did not hit eachother yet, because the calculations aren't precise.
function hitDetection(){
    var userHitBox1 = getHitBox(
        userCar.position, // user position
        initialUserAngle + movedUserAngle, // user angle 
        true, // clockwise
        15 // hitbox position compared to the car's position
    );

    var userHitBox2 = getHitBox(
        userCar.position,
        initialUserAngle + movedUserAngle,
        true,
        -15
    );

//Uncomment to make Hit Boxes visible for User's car
    // userCar.hitBox1.position.x = userHitBox1.x;
    // userCar.hitBox1.position.y = userHitBox1.y;

    // userCar.hitBox2.position.x = userHitBox2.x;
    // userCar.hitBox2.position.y = userHitBox2.y;

    var hit = AiVehicles.some((vehicle) => {
        if (vehicle.type == "car") {
            var vehicleHitBox1 = getHitBox(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                15
            );

            var vehicleHitBox2 = getHitBox(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                -15
            );

        //Uncomment to make Hit Boxes visible for AI's car
            // vehicle.mesh.hitBox1.position.x = vehicleHitBox1.x;
            // vehicle.mesh.hitBox1.position.y = vehicleHitBox1.y;
    
            // vehicle.mesh.hitBox2.position.x = vehicleHitBox2.x;
            // vehicle.mesh.hitBox2.position.y = vehicleHitBox2.y;

            //User hits another vehicle
            if(getDistance(userHitBox1, vehicleHitBox1) <40) return true;
            if(getDistance(userHitBox1, vehicleHitBox2) <40) return true;

            //Ai vehicle hits user's car
            if(getDistance(userHitBox2, vehicleHitBox1) <40) return true;
        }

        if (vehicle.type == "jeep") {
            var vehicleHitBox1 = getHitBox(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                18
            );

            var vehicleHitBox2 = getHitBox(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                -18
            );

        //Uncomment to make Hit Boxes visible for AI's Jeep
            // vehicle.mesh.hitBox1.position.x = vehicleHitBox1.x;
            // vehicle.mesh.hitBox1.position.y = vehicleHitBox1.y;
    
            // vehicle.mesh.hitBox2.position.x = vehicleHitBox2.x;
            // vehicle.mesh.hitBox2.position.y = vehicleHitBox2.y;

            //User hits another vehicle
            if(getDistance(userHitBox1, vehicleHitBox1) <40) return true;
            if(getDistance(userHitBox1, vehicleHitBox2) <40) return true;

            //Ai vehicle hits user's car
            if(getDistance(userHitBox2, vehicleHitBox1) <40) return true;
        }
        
        });

        //when hit, display the game over screen and set the animation loop to null
    if(hit){
        if (endElement) endElement.style.display = "flex";
        renderer.setAnimationLoop(null); 
    } 
}

//getting back the distance between 2 points based on the pythagorean theorem
function getDistance(coordinate1, coordinate2){
    return Math.sqrt(
        (coordinate2.x - coordinate1.x) ** 2 + (coordinate2.y - coordinate1.y) ** 2 
    );
}

 //Animate
 console.log("Define the animation function");
 //timestamp is constantly increasing as the game goes
 function animate(timestamp)
 {
     //keep track of the previous animation frame with previousTimestamp
     if(!previousTimestamp){
         previousTimestamp = timestamp;
         return;
     }
 
     //Calculating the time passed between the two animation frames
     var timeDelta = timestamp - previousTimestamp;
 
     moveUserCar(timeDelta);
 
     //calculate the no of laps. Dividing the movedUserAngle with a full turn (360 degrees)
     //used math.floor so that it will only show whole no. For example, it won't show 2.5 laps
     var laps = Math.floor(Math.abs(movedUserAngle) / (Math.PI * 2));
 
     //Updating the score
     //Added this condition so that it won't update with every animation frame
     if (laps != score){
         score = "Score: " + laps;
         scoreElement.innerText = score;
     }
     
     //Add new cars at the start and with every 5th lap
     if(AiVehicles.length < (laps+1) / 5) addAiVehicle();
     
     moveAiVehicles(timeDelta);
 
     hitDetection();
 
     renderer.render(scene, camera);
     previousTimestamp = timestamp;
 }

 //Created a second animate fuction in order to load the Texture Mappings and when the scene is rendered
 function animate2()
 {
    requestAnimationFrame(animate2);
     controls.update();
     renderer.render(scene, camera);
 }
 animate2();