
let mediaRecorder;
let audioChunks = [];
let instruction = null;

function startRecording() {
	navigator.mediaDevices.getUserMedia({ audio: true })
		.then(stream => {
			audioChunks = [];
			mediaRecorder = new MediaRecorder(stream);

			mediaRecorder.ondataavailable = event => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				if (instruction == "stop") {
					const audioBlob = new Blob(audioChunks, { type: 'audio/mp4' });
					const audioUrl = URL.createObjectURL(audioBlob);

	




					// send via chrome api

					chrome.runtime.sendMessage({
						audioUrl: audioUrl,
						audioBlob: audioBlob,
						type: "audio"
					}, function (response) {
					}
					);

					audioChunks = [];

				}

				if (instruction == "trash") {
					audioChunks	= [];
				}

				if (instruction == "restart") {
					audioChunks	= [];
				}

				instruction = null;
				


		
			};

			mediaRecorder.start();

		})
		.catch(error => {
			console.error('Error accessing microphone:', error);
		});
}

function stopRecording() {
	if (mediaRecorder && mediaRecorder.state === 'recording') {
		instruction = "stop";
		mediaRecorder.stop();


		

	}
}

chrome.runtime.onMessage.addListener(
	async function (message, sender, sendResponse) {
		if (message.type == "getPermissions") {
			try {
				await navigator.mediaDevices.getUserMedia({ audio: true });
				chrome.runtime.sendMessage({
					data: "permissionsgranted"
				}, function (response) {
				});

			} catch {
				chrome.runtime.sendMessage({
					data: "permissionsdenied"
				}, function (response) {
				});
				return;
			}
		}

		if (message.type == "startaudio") {
			startRecording();
			sendResponse("started");
		}

		if (message.type == "stopaudio") {
			stopRecording();
		//	sendResponse("stopped");
		}

		if (message.type == "trashaudio") {
			instruction = "trash";
			mediaRecorder.stop();
			sendResponse("stopped");
		}

		if (message.type == "restartaudio") {
			instruction = "restart";
			mediaRecorder.stop();
			sendResponse("restart");
		}
	}
);


/*
import React from 'react';
import ReactDOM from 'react-dom';
import { useEffect, useState, useRef } from 'react';





const Content = () => {
	const [recording, setRecording] = useState(false);
	const [audioBlobUrl, setAudioBlobUrl] = useState(null);
	const [processing, setProcessing] = useState(false);
	const mediaRecorder = useRef(null);
	const audioChunks = useRef([]);
	const [transcribedText, setTranscribedText] = useState(null);


	useEffect(() => {
		chrome.runtime.onMessage.addListener(
			async function (message, sender, sendResponse) {
				if (message.type == "getPermissions") {
					try {
						await navigator.mediaDevices.getUserMedia({ audio: true });
						chrome.runtime.sendMessage({
							data: "permissionsgranted"
						}, function (response) {
						});

					} catch {
						chrome.runtime.sendMessage({
							data: "permissionsdenied"
						}, function (response) {
						});
						return;
					}
				}

				if (message.type == "startaudio") {
					start();
					sendResponse("started");
				}

				if (message.type == "stopaudio") {
					stop();
					sendResponse("stopped");
				}

				if (message.type == "trashaudio") {
					stop();
					sendResponse("stopped");
				}
			}
		);
	})

	const start = () => {
		navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
			mediaRecorder.current = new MediaRecorder(stream);

			mediaRecorder.current.ondataavailable = (event) => {
				audioChunks.current.push(event.data);
			};

			mediaRecorder.current.onstop = () => {
			




				const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp4' });
				const audioUrl = URL.createObjectURL(audioBlob);


				// send via chrome api 

				chrome.runtime.sendMessage({
					audioUrl: audioUrl,
					audioBlob: audioBlob,
					type: "audio"
				}, function (response) {
				}
				);

				setAudioBlobUrl(null);
				setAudioBlobUrl(null);
				setProcessing(false);
				mediaRecorder.current = null;
				audioChunks.current = [];



			};

			setRecording(true);
			audioChunks.current = []; // clear old data
			mediaRecorder.current.start();
		});
	};

	const stop = () => {
		setRecording(false);
		if (mediaRecorder.current) {
			mediaRecorder.current.stop();
		

		}
	};

	return (
		<div></div>
	)
}



const myDiv = document.createElement('div');
myDiv.id = 'my-id';

document.body.appendChild(myDiv);

ReactDOM.render(<Content />, myDiv);

*/