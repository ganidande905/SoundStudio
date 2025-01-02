document.addEventListener('DOMContentLoaded', async () => {
    const payNowButton = document.getElementById('pay-now-button');
    const startRecordingButton = document.getElementById('start-recording');
    const stopRecordingButton = document.getElementById('stop-recording');
    const saveAudioButton = document.getElementById('save-audio');
    const audioPreview = document.getElementById('audio-preview');
    const recordingSection = document.getElementById('recording-section');

    let mediaRecorder;
    let audioChunks = [];
    const sessionId = new URLSearchParams(window.location.search).get('session_id');

    if (!sessionId) {
        alert('No session selected.');
        return;
    }

    // Payment
    payNowButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                recordingSection.style.display = 'block';
            } else {
                alert(data.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Error during payment:', error);
        }
    });

    // Start Recording
    startRecordingButton.addEventListener('click', async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPreview.src = audioUrl;
            audioPreview.style.display = 'block';
            saveAudioButton.style.display = 'block';
            saveAudioButton.audioBlob = audioBlob;
        };

        mediaRecorder.start();
        startRecordingButton.style.display = 'none';
        stopRecordingButton.style.display = 'block';
    });

    // Stop Recording
    stopRecordingButton.addEventListener('click', () => {
        mediaRecorder.stop();
        stopRecordingButton.style.display = 'none';
        startRecordingButton.style.display = 'block';
    });

    // Save Recording
    saveAudioButton.addEventListener('click', async () => {
        const audioBlob = saveAudioButton.audioBlob;
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('session_id', sessionId);

        fetch('/api/save-audio', {
            method: 'POST',
            body: formData,
        });
        try {
            const response = await fetch('/api/save-audio', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                alert('Audio saved successfully');
            } else {
                alert(data.message || 'Failed to save audio');
            }
        } catch (error) {
            console.error('Error saving audio:', error);
        }
    });
});
document.getElementById('back-to-dashboard').addEventListener('click', () => {
    window.location.href = '/dashboard';
});

