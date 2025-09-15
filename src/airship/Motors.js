// Creates a single motor visual, which is a composite of a pylon and a propeller.
function createMotorSprite(scene, x, y) {
  // --- MODIFIED: Use the new, smaller parameters for pylon and propeller ---
  const pylon = scene.add.rectangle(0, 0, 2, 4, 0xffffff).setStrokeStyle(0.5, 0x333333);
  const propeller = scene.add.rectangle(0, -3, 8, 0.4, 0xffffff).setStrokeStyle(0.5, 0x555555);

  // Use a Container to group the pylon and propeller together.
  const motor = scene.add.container(x, y, [pylon, propeller]);
  
  return motor;
}

// Spawns all motors based on the configuration and adds them to the airship container.
export function spawnMotors(scene, airshipContainer, motorConfigs, hullWidth) {
  if (!motorConfigs || motorConfigs.length === 0) {
    return [];
  }
  const motors = [];
  motorConfigs.forEach(config => {
    // Calculate the motor's position relative to the airship's center
    const x = (config.xFrac - 0.5) * hullWidth;
    const y = config.yOffset;
    
    const motor = createMotorSprite(scene, x, y);
    airshipContainer.add(motor);
    motors.push(motor);
  });
  return motors;
}

// Updates motors based on the current mode
export function updateMotors(motors, motorVector, motorMode) {
  if (!motors) return;

  // Define fixed angles for clarity
  const angleUp = Phaser.Math.DegToRad(0);
  const angleDown = Phaser.Math.DegToRad(180);
  const angleBack = Phaser.Math.DegToRad(-90);

  // This is the angle for user-controlled motors
  const userAngle = motorVector.angle() + (Math.PI *3/2);

  motors.forEach((motor, index) => {
    switch (motorMode) {
      case 1: // Manual Mode
        if (index === 3 || index === 4) { // First and last motor
          motor.rotation = angleUp;
        } else { // Middle three motors
          motor.rotation = userAngle;
        }
        break;
      
      case 2: // Neutral Manual Mode
        if (index === 3) { // Front motor (last in array)
          motor.rotation = angleUp;
        } else if (index === 4) { // Back motor (first in array)
          motor.rotation = angleDown;
        }
          else if (index === 1) { // Left motor
            motor.rotation = angleDown;
          
        } else { // Middle three motors
          motor.rotation = userAngle;
        }
        break;

      case 3: // Cruise Mode
        motor.rotation = angleBack;
        break;
    }
  });
}