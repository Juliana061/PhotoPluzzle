document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const puzzleCanvas = document.getElementById('puzzleCanvas');
    const shuffleButton = document.getElementById('shuffleButton');
    const resetButton = document.getElementById('resetButton');
    const difficultySelect = document.getElementById('difficulty');
    const messageEl = document.getElementById('message');
    const completionMessageEl = document.getElementById('completionMessage');
    const ctx = puzzleCanvas.getContext('2d');

    let image = null;
    let rows = 3;
    let cols = 3;
    let pieceWidth, pieceHeight;
    let pieces = [];
    let originalPieces = [];
    let draggingPiece = null;
    let startDragX, startDragY;

    // Tamaño inicial del canvas
    puzzleCanvas.width = 600;
    puzzleCanvas.height = 600;

    function drawMessage(text, color = 'red') {
        messageEl.textContent = text;
        messageEl.style.color = color;
    }

    function drawCompletionMessage(visible) {
        completionMessageEl.classList.toggle('hidden', !visible);
    }

    function drawPiece(piece, x, y) {
        const sourceX = piece.originalCol * pieceWidth;
        const sourceY = piece.originalRow * pieceHeight;
        ctx.drawImage(image, sourceX, sourceY, pieceWidth, pieceHeight, x, y, pieceWidth, pieceHeight);
    }

    function drawPieces() {
        ctx.clearRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);
        pieces.forEach(piece => {
            const x = piece.currentCol * pieceWidth;
            const y = piece.currentRow * pieceHeight;
            drawPiece(piece, x, y);
            ctx.strokeStyle = '#e5e7eb';
            ctx.strokeRect(x, y, pieceWidth, pieceHeight);
        });
    }

    function createPieces() {
        if (!image) return;

        const aspect = image.width / image.height;
        const canvasAspect = puzzleCanvas.width / puzzleCanvas.height;
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (aspect > canvasAspect) {
            drawWidth = puzzleCanvas.width;
            drawHeight = puzzleCanvas.width / aspect;
            offsetY = (puzzleCanvas.height - drawHeight) / 2;
        } else {
            drawHeight = puzzleCanvas.height;
            drawWidth = puzzleCanvas.height * aspect;
            offsetX = (puzzleCanvas.width - drawWidth) / 2;
        }

        ctx.clearRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        pieceWidth = Math.floor(drawWidth / cols);
        pieceHeight = Math.floor(drawHeight / rows);
        
        pieces = [];
        originalPieces = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const piece = {
                    originalRow: r,
                    originalCol: c,
                    currentRow: r,
                    currentCol: c,
                };
                pieces.push(piece);
                originalPieces.push({ ...piece });
            }
        }
    }

    function shufflePieces() {
        if (!image) {
            drawMessage('Sube una imagen para empezar a barajar.');
            return;
        }
        drawMessage('', 'red');
        drawCompletionMessage(false);
        
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }

        let k = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                pieces[k].currentRow = r;
                pieces[k].currentCol = c;
                k++;
            }
        }
        drawPieces();
    }

    function isSolved() {
        return pieces.every(piece => 
            piece.originalRow === piece.currentRow && piece.originalCol === piece.currentCol
        );
    }
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                image = new Image();
                image.onload = () => {
                    createPieces();
                    shufflePieces();
                    drawMessage('¡Imagen cargada! Arrastra las piezas para resolver el rompecabezas.', 'green');
                };
                image.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    difficultySelect.addEventListener('change', (event) => {
        const newDifficulty = parseInt(event.target.value, 10);
        rows = newDifficulty;
        cols = newDifficulty;
        if (image) {
            createPieces();
            shufflePieces();
        }
    });

    shuffleButton.addEventListener('click', () => {
        if (image) {
            shufflePieces();
        } else {
            drawMessage('Sube una imagen primero.');
        }
    });

    resetButton.addEventListener('click', () => {
        if (image) {
            pieces = originalPieces.map(p => ({ ...p }));
            drawPieces();
            drawMessage('Rompecabezas restablecido.');
            drawCompletionMessage(false);
        } else {
            drawMessage('Sube una imagen primero.');
        }
    });

    let isDragging = false;

    function getPieceAt(x, y) {
        const col = Math.floor(x / pieceWidth);
        const row = Math.floor(y / pieceHeight);
        return pieces.find(p => p.currentCol === col && p.currentRow === row);
    }

    function handleStart(event) {
        if (!image || isSolved()) return;
        
        let clientX, clientY;
        if (event.touches) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const rect = puzzleCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        draggingPiece = getPieceAt(x, y);

        if (draggingPiece) {
            isDragging = true;
            startDragX = x;
            startDragY = y;
            puzzleCanvas.style.cursor = 'grabbing';
        }
    }
    
    function handleMove(event) {
        if (!isDragging || !draggingPiece) return;
        event.preventDefault();
    
        let clientX, clientY;
        if (event.touches) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
    
        const rect = puzzleCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
    
        const tempX = x - (startDragX - draggingPiece.currentCol * pieceWidth);
        const tempY = y - (startDragY - draggingPiece.currentRow * pieceHeight);
    
        drawPieces();
        drawPiece(draggingPiece, tempX, tempY);
    }
    
    function handleEnd(event) {
        if (!isDragging || !draggingPiece) return;
        isDragging = false;
        puzzleCanvas.style.cursor = 'grab';
    
        let clientX, clientY;
        if (event.changedTouches) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
    
        const rect = puzzleCanvas.getBoundingClientRect();
        const dropX = clientX - rect.left;
        const dropY = clientY - rect.top;
    
        const droppedOnPiece = getPieceAt(dropX, dropY);
    
        if (droppedOnPiece && droppedOnPiece !== draggingPiece) {
            const tempRow = draggingPiece.currentRow;
            const tempCol = draggingPiece.currentCol;
            
            draggingPiece.currentRow = droppedOnPiece.currentRow;
            draggingPiece.currentCol = droppedOnPiece.currentCol;
            
            droppedOnPiece.currentRow = tempRow;
            droppedOnPiece.currentCol = tempCol;
        }
    
        draggingPiece = null;
        drawPieces();
    
        if (isSolved()) {
            drawCompletionMessage(true);
            drawMessage('¡Rompecabezas resuelto!', 'green');
        }
    }

    puzzleCanvas.addEventListener('mousedown', handleStart);
    puzzleCanvas.addEventListener('mousemove', handleMove);
    puzzleCanvas.addEventListener('mouseup', handleEnd);
    puzzleCanvas.addEventListener('mouseleave', () => {
        if (isDragging) handleEnd(event);
    });

    puzzleCanvas.addEventListener('touchstart', handleStart);
    puzzleCanvas.addEventListener('touchmove', handleMove);
    puzzleCanvas.addEventListener('touchend', handleEnd);
});
