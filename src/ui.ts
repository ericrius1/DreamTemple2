import { Store } from "./store"

export function createUI(store: Store) {
  const { playerPosition } = store
  const uiElement = document.createElement("div")
  uiElement.style.position = "fixed"
  uiElement.style.bottom = "10px"
  uiElement.style.left = "10px"
  uiElement.style.color = "black"
  uiElement.style.fontFamily = "Arial, sans-serif"
  uiElement.style.fontSize = "14px"
  document.body.appendChild(uiElement)

  const startTime = Date.now()

  function updateUI() {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
    const height = Math.round(playerPosition.y)
    uiElement.innerHTML = `Height: ${height}m<br>Time: ${elapsedSeconds}s`
    requestAnimationFrame(updateUI)
  }

  updateUI()

  // Create webcam button
  const webcamButton = document.createElement("button")
  webcamButton.textContent = "Enable Webcam"
  webcamButton.style.position = "fixed"
  webcamButton.style.bottom = "10px"
  webcamButton.style.left = "50%"
  webcamButton.style.transform = "translateX(-50%)"
  webcamButton.style.padding = "10px 20px"
  webcamButton.style.backgroundColor = "lightblue"
  webcamButton.style.border = "none"
  webcamButton.style.borderRadius = "20px"
  webcamButton.style.color = "white"
  webcamButton.style.fontFamily = "Arial, sans-serif"
  webcamButton.style.fontSize = "16px"
  webcamButton.style.cursor = "pointer"
  document.body.appendChild(webcamButton)

  // Create canvas for webcam display
  const webcamCanvas = document.createElement("canvas")
  webcamCanvas.style.position = "fixed"
  webcamCanvas.style.top = "10px"
  webcamCanvas.style.right = "10px"
  webcamCanvas.style.display = "none"
  document.body.appendChild(webcamCanvas)

  // Set up webcam
  const video = document.createElement("video")
  video.style.display = "none"

  webcamButton.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      video.srcObject = stream
      video.play()

      // Set canvas dimensions after video metadata is loaded
      video.addEventListener("loadedmetadata", () => {
        webcamCanvas.width = video.videoWidth
        webcamCanvas.height = video.videoHeight
      })

      webcamCanvas.style.display = "block"

      const ctx = webcamCanvas.getContext("2d")
      function drawWebcam() {
        ctx.drawImage(video, 0, 0, webcamCanvas.width, webcamCanvas.height)
        requestAnimationFrame(drawWebcam)
      }
      drawWebcam()
    } catch (error) {
      console.error("Error accessing webcam:", error)
    }
  })
}
