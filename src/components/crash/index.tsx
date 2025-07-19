/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
// import { useCrashContext } from "../Main/context";
import "./crash.scss";
import Unity from "react-unity-webgl";
import Context from "../../context";

// Import propeller image
const propeller = "/src/assets/images/propeller.png";

let currentFlag = 0;

export default function WebGLStarter() {
	const { GameState, currentNum, time, unityState, myUnityContext, setCurrentTarget, bettingTimeLeft } = React.useContext(Context)
	const [target, setTarget] = React.useState(1);
	const [waiting, setWaiting] = React.useState(0);
	const [flag, setFlag] = React.useState(1);

	React.useEffect(() => {
		let myInterval;
		if (GameState === "PLAYING") {
			setFlag(2);
			// Use server-provided multiplier directly
			setTarget(currentNum);
			setCurrentTarget(currentNum);
			
			// Update flag based on multiplier for visual effects
			if (currentNum > 2 && flag === 2) {
				setFlag(3);
			} else if (currentNum > 10 && flag === 3) {
				setFlag(4);
			}
		} else if (GameState === "GAMEEND") {
			setFlag(5);
			setCurrentTarget(currentNum);
			setTarget(currentNum);
		} else if (GameState === "BET") {
			setFlag(1);
			setTarget(1);
			setCurrentTarget(1);
			
			// Use server-provided betting time left
			if (bettingTimeLeft !== undefined) {
				setWaiting(5000 - bettingTimeLeft);
			}
		}
	}, [GameState, currentNum, bettingTimeLeft, flag, setCurrentTarget])

	React.useEffect(() => {
		myUnityContext?.send("GameManager", "RequestToken", JSON.stringify({
			gameState: flag
		}));
		currentFlag = flag;
	}, [flag, myUnityContext]);

	return (
		<div className="crash-container">
			<div className="canvas">
				<Unity unityContext={myUnityContext} matchWebGLToCanvasSize={true} />
			</div>
			<div className="crash-text-container">
				{GameState === "BET" ? (
					<div className={`crashtext wait font-9`} >
						<div className="rotate">
							<img width={100} height={100} src={propeller} alt="propellar"></img>
						</div>
						<div className="waiting-font">WAITING FOR NEXT ROUND</div>
						<div className="waiting">
							<div style={{ width: `${Math.max(0, (5000 - waiting) * 100 / 5000)}%` }}></div>
						</div>
					</div>
				) : (
					<div className={`crashtext ${GameState === "GAMEEND" && "red"}`}>
						{GameState === "GAMEEND" && <div className="flew-away">FLEW AWAY!</div>}
						<div>
							{target - 0.01 >= 1 ? Number(target - 0.01).toFixed(2) : "1.00"} <span className="font-[900]">x</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

