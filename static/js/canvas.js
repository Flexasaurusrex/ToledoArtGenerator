class ToledoArtCanvas {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;
        this.initializationAttempts = 0;
        this.maxAttempts = 3;
        this.redSculptureReady = true;
        this.glassToledoReady = true;
        this.mudHensReady = true;
        
        this.initialize();
    }
    
    initialize() {
        if (this.initializationAttempts >= this.maxAttempts) {
            console.error(`Failed to initialize canvas after ${this.maxAttempts} attempts`);
            return;
        }
        
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with id ${this.canvasId} not found`);
            setTimeout(() => {
                this.initializationAttempts++;
                this.initialize();
            }, 100);
            return;
        }
        
        try {
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Failed to get canvas context');
            }
            
            this.setupCanvas();
            this.initialized = true;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('Canvas initialization error:', error);
            setTimeout(() => {
                this.initializationAttempts++;
                this.initialize();
            }, 100);
        }
    }
    
    setupCanvas(forceSize = null) {
        if (!this.canvas || !this.ctx) {
            console.error('Cannot setup canvas: canvas or context not available');
            return;
        }
        
        const resize = () => {
            if (!this.canvas) return;
            
            if (forceSize) {
                this.canvas.width = forceSize.width;
                this.canvas.height = forceSize.height;
            } else {
                const parent = this.canvas.parentElement;
                if (parent) {
                    this.canvas.width = parent.clientWidth;
                    this.canvas.height = 400;
                }
            }
        };
        
        resize();
        window.removeEventListener('resize', resize);
        window.addEventListener('resize', resize);
    }
    
    updatePreview(params) {
        if (!this.initialized || !this.ctx || !this.canvas) {
            console.error('Canvas not properly initialized');
            if (this.initializationAttempts < this.maxAttempts) {
                this.initialize();
                return;
            }
            return;
        }

        const { intensity, chaos, colorTone, lineThickness = 1, buildingDensity = 1, 
                skylineComplexity = 5, textureGrain = 1, colorIntensity = 1, hueAdjust = 0,
                redSculpture = false, glassToledo = false, mudHens = false, toledoMuseum = false } = params;
        
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            const colors = {
                downtown: ['#2c3e50', '#34495e', '#ecf0f1', '#3498db', '#e74c3c', '#95a5a6'],
                sunset: ['#e67e22', '#d35400', '#f39c12', '#e74c3c', '#c0392b', '#95a5a6'],
                industrial: ['#7f8c8d', '#95a5a6', '#bdc3c7', '#34495e', '#2c3e50', '#ecf0f1'],
                riverfront: ['#27ae60', '#2ecc71', '#16a085', '#1abc9c', '#3498db', '#ecf0f1'],
                storm: ['#34495e', '#2c3e50', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1']
            };
            
            const selectedColors = colors[colorTone] || colors.downtown;
            
            const adjustedColors = selectedColors.map(color => 
                this.adjustColorHue(
                    this.adjustColorIntensity(color, colorIntensity),
                    hueAdjust
                )
            );
            
            this.drawToledoCityscape(adjustedColors, parseFloat(intensity), parseFloat(chaos),
                parseFloat(lineThickness), parseFloat(buildingDensity),
                parseInt(skylineComplexity), parseFloat(textureGrain));

            if (glassToledo) {
                this.addGlassToledoOverlay();
            }

            if (mudHens) {
                this.addMudHensOverlay();
            }

            if (redSculpture) {
                this.addRedSculptureOverlay();
            }

            if (toledoMuseum) {
                this.addToledoMuseumOverlay();
            }
        } catch (error) {
            console.error('Error updating preview:', error);
        }
    }

    addRedSculptureOverlay() {
        const centerX = this.canvas.width * 0.25;
        const centerY = this.canvas.height * 0.7;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(0, 25, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        const sculptureRed = '#DC143C';
        const sculptureShade = '#B71C1C';
        
        const spikeData = [
            {x: 0, y: -60, color: sculptureRed},
            {x: -18, y: -35, color: sculptureRed},
            {x: 18, y: -35, color: sculptureRed},
            {x: -25, y: -25, color: sculptureShade},
            {x: 25, y: -25, color: sculptureShade}
        ];
        
        spikeData.forEach(spike => {
            this.ctx.fillStyle = spike.color;
            this.ctx.beginPath();
            this.ctx.moveTo(spike.x, 20);
            this.ctx.lineTo(spike.x - 6, spike.y);
            this.ctx.lineTo(spike.x + 6, spike.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.moveTo(spike.x - 6, spike.y);
            this.ctx.lineTo(spike.x + 6, spike.y);
            this.ctx.lineTo(spike.x + 4, 20);
            this.ctx.lineTo(spike.x - 4, 20);
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }

    addToledoMuseumOverlay() {
        const centerX = this.canvas.width * 0.5;
        const centerY = this.canvas.height * 0.8;
        const scale = 1.2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        
        this.ctx.fillStyle = '#D3D3D3';
        for (let i = 0; i < 3; i++) {
            const stepWidth = 140 - (i * 5);
            const stepHeight = 3;
            this.ctx.beginPath();
            this.ctx.rect(-stepWidth/2, 15 + (i * stepHeight), stepWidth, stepHeight);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.beginPath();
        this.ctx.rect(-120, -15, 240, 30);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-120, -15);
        this.ctx.lineTo(0, -35);
        this.ctx.lineTo(120, -15);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#D3D3D3';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 6; i++) {
            const colX = -100 + (i * 40);
            
            this.ctx.beginPath();
            this.ctx.rect(colX - 4, -15, 8, 25);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.rect(colX - 6, -18, 12, 3);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.rect(colX - 5, 8, 10, 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('THE TOLEDO MUSEUM OF ART', 0, 5);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 25, 120, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    addGlassToledoOverlay() {
        const centerX = this.canvas.width * 0.5;
        const centerY = this.canvas.height * 0.75;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 20, 80, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const glassGradient = this.ctx.createLinearGradient(-60, -50, 60, 15);
        glassGradient.addColorStop(0, 'rgba(173, 216, 230, 0.8)');
        glassGradient.addColorStop(0.5, 'rgba(135, 206, 235, 0.6)');
        glassGradient.addColorStop(1, 'rgba(176, 196, 222, 0.7)');
        
        this.ctx.beginPath();
        this.ctx.moveTo(-60, 15);
        this.ctx.quadraticCurveTo(-60, -50, 0, -55);
        this.ctx.quadraticCurveTo(60, -50, 60, 15);
        this.ctx.lineTo(60, 20);
        this.ctx.lineTo(-60, 20);
        this.ctx.closePath();
        this.ctx.fillStyle = glassGradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(192, 192, 192, 0.8)';
        this.ctx.lineWidth = 1;
        
        for (let i = -40; i <= 40; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 20);
            this.ctx.quadraticCurveTo(i, -35 + Math.abs(i) * 0.3, i, -25 + Math.abs(i) * 0.4);
            this.ctx.stroke();
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 20);
        this.ctx.lineTo(0, -55);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#A0A0A0';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-60, 15);
        this.ctx.quadraticCurveTo(-60, -50, 0, -55);
        this.ctx.quadraticCurveTo(60, -50, 60, 15);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    addMudHensOverlay() {
        const centerX = this.canvas.width * 0.5;
        const centerY = this.canvas.height * 0.8;
        const scale = 1.4;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.beginPath();
        this.ctx.rect(-120, -20, 240, 40);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#607D8B';
        this.ctx.beginPath();
        this.ctx.moveTo(-125, -20);
        this.ctx.lineTo(-125, -35);
        this.ctx.lineTo(125, -35);
        this.ctx.lineTo(125, -20);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2196F3';
        for (let i = -100; i <= 100; i += 25) {
            this.ctx.beginPath();
            this.ctx.rect(i - 8, -15, 16, 20);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FIFTH THIRD FIELD', 0, -25);
        
        this.ctx.strokeStyle = '#8BC34A';
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 20);
        this.ctx.lineTo(-25, 35);
        this.ctx.lineTo(0, 50);
        this.ctx.lineTo(25, 35);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#D2691E';
        this.ctx.beginPath();
        this.ctx.arc(0, 35, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 47, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        for (let i = -100; i <= 100; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, -35);
            this.ctx.lineTo(i, -50);
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(i, -52, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.strokeStyle = '#D32F2F';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(80, -5, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#D32F2F';
        this.ctx.font = 'bold 8px Arial';
        this.ctx.fillText('HENS', 80, -2);
        this.ctx.fillText('VILLE', 80, 6);
        
        this.ctx.restore();
    }

    adjustColorHue(color, hueAdjust) {
        if (hueAdjust === 0) return color;
        
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        h = (h * 360 + parseFloat(hueAdjust)) % 360;
        if (h < 0) h += 360;
        h /= 360;
        
        let r1, g1, b1;
        if (s === 0) {
            r1 = g1 = b1 = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r1 = hue2rgb(p, q, h + 1/3);
            g1 = hue2rgb(p, q, h);
            b1 = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
    }

    adjustColorIntensity(color, intensity) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const factor = intensity;
        const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
        const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
        const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    drawClouds(colors, intensity, chaos) {
        const skyHeight = this.canvas.height * 0.35;
        
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, skyHeight);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.7, '#B0C4DE');
        skyGradient.addColorStop(1, '#D3D3D3');
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, skyHeight);

        if (chaos < 0.3) {
            this.drawCumulusClouds(colors, intensity);
        } else if (chaos < 0.7) {
            this.drawCumulusClouds(colors, intensity);
            this.drawStratusClouds(colors, intensity, chaos);
        } else {
            this.drawStormClouds(colors, intensity, chaos);
        }
    }

    drawCumulusClouds(colors, intensity) {
        const cloudCount = 3 + Math.floor(intensity * 4);
        
        for (let i = 0; i < cloudCount; i++) {
            const x = (this.canvas.width * (i + 0.5)) / cloudCount + (Math.random() - 0.5) * 60;
            const y = this.canvas.height * (0.1 + Math.random() * 0.2);
            const baseWidth = 80 + Math.random() * 60;
            const baseHeight = 40 + Math.random() * 30;
            
            const puffCount = 5 + Math.floor(Math.random() * 3);
            
            for (let j = 0; j < puffCount; j++) {
                const puffX = x + (j - puffCount/2) * (baseWidth / puffCount) * 0.8;
                const puffY = y + (Math.random() - 0.5) * baseHeight * 0.5;
                const puffRadius = baseWidth / puffCount + Math.random() * 20;
                
                const cloudGradient = this.ctx.createRadialGradient(
                    puffX - puffRadius * 0.3, puffY - puffRadius * 0.3, 0,
                    puffX, puffY, puffRadius
                );
                cloudGradient.addColorStop(0, '#FFFFFF');
                cloudGradient.addColorStop(0.6, '#F0F0F0');
                cloudGradient.addColorStop(1, '#D0D0D0');
                
                this.ctx.beginPath();
                this.ctx.arc(puffX, puffY, puffRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = cloudGradient;
                this.ctx.fill();
            }
        }
    }

    drawStratusClouds(colors, intensity, chaos) {
        const layerCount = 2 + Math.floor(chaos * 3);
        
        for (let layer = 0; layer < layerCount; layer++) {
            const y = this.canvas.height * (0.05 + layer * 0.08);
            const opacity = 0.6 - (layer * 0.1);
            
            this.ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            
            for (let x = 0; x <= this.canvas.width; x += 20) {
                const waveHeight = Math.sin(x * 0.01 + layer) * 10 * chaos;
                this.ctx.lineTo(x, y + 15 + waveHeight);
            }
            
            this.ctx.lineTo(this.canvas.width, y - 20);
            this.ctx.lineTo(0, y - 20);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawStormClouds(colors, intensity, chaos) {
        const y = this.canvas.height * 0.1;
        const cloudHeight = this.canvas.height * 0.35;
        
        const stormGradient = this.ctx.createLinearGradient(0, y, 0, y + cloudHeight);
        stormGradient.addColorStop(0, '#4A4A4A');
        stormGradient.addColorStop(0.3, '#696969');
        stormGradient.addColorStop(0.8, '#A9A9A9');
        stormGradient.addColorStop(1, '#D3D3D3');
        
        this.ctx.fillStyle = stormGradient;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, y + cloudHeight);
        
        const segments = 8;
        for (let i = 0; i <= segments; i++) {
            const x = (this.canvas.width * i) / segments;
            const billowHeight = y + Math.random() * cloudHeight * 0.7;
            const billowBottom = y + cloudHeight - Math.random() * 30;
            
            if (i === 0) {
                this.ctx.lineTo(x, billowBottom);
            } else {
                const prevX = (this.canvas.width * (i - 1)) / segments;
                const controlX = prevX + (x - prevX) / 2;
                const controlY = billowHeight;
                this.ctx.quadraticCurveTo(controlX, controlY, x, billowBottom);
            }
        }
        
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.lineTo(0, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        if (chaos > 0.8 && Math.random() > 0.7) {
            this.ctx.strokeStyle = '#FFFACD';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            const lightningX = this.canvas.width * 0.3 + Math.random() * this.canvas.width * 0.4;
            this.ctx.moveTo(lightningX, y + cloudHeight * 0.3);
            this.ctx.lineTo(lightningX + (Math.random() - 0.5) * 20, y + cloudHeight * 0.6);
            this.ctx.lineTo(lightningX + (Math.random() - 0.5) * 30, y + cloudHeight);
            this.ctx.stroke();
        }
    }

    drawSun(colors, intensity, chaos) {
        const centerX = this.canvas.width * 0.8;
        const centerY = this.canvas.height * 0.15;
        const radius = 40 + (intensity * 20);

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = colors[2];
        this.ctx.fill();

        const splatCount = 15 + (chaos * 20);
        for (let i = 0; i < splatCount; i++) {
            const angle = (Math.PI * 2 * i) / splatCount;
            const distance = radius + (Math.random() * 30 * chaos);
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = colors[2];
            this.ctx.fill();
        }
    }

    drawToledoBuildings(colors, intensity, chaos, buildingDensity) {
        const buildingCount = Math.floor((5 + Math.floor(chaos * 8)) * buildingDensity);
        const baseHeight = this.canvas.height * 0.4;
        
        for (let i = 0; i < buildingCount; i++) {
            const x = (this.canvas.width * (i + 1)) / (buildingCount + 1);
            const width = 25 + (Math.random() * 30);
            const height = baseHeight * (0.3 + (Math.random() * 0.8 * intensity));
            
            this.ctx.beginPath();
            this.ctx.rect(x - width/2, this.canvas.height - height, width, height);
            this.ctx.fillStyle = colors[0];
            this.ctx.fill();

            const windowRows = Math.floor(height / 20);
            const windowCols = Math.floor(width / 15);
            
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    if (Math.random() > 0.3) {
                        const winX = x - width/2 + (col + 0.5) * (width / windowCols);
                        const winY = this.canvas.height - height + (row + 0.5) * (height / windowRows);
                        
                        this.ctx.beginPath();
                        this.ctx.rect(winX - 3, winY - 3, 6, 6);
                        this.ctx.fillStyle = colors[3];
                        this.ctx.fill();
                    }
                }
            }

            if (chaos > 0.3) {
                for (let j = 0; j < 2; j++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x - width/2 + (Math.random() * width), this.canvas.height - height);
                    this.ctx.lineTo(x - width/2 + (Math.random() * width), this.canvas.height);
                    this.ctx.strokeStyle = colors[1];
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }

    drawMaumeeRiver(colors) {
        const riverY = this.canvas.height * 0.85;
        const riverHeight = this.canvas.height * 0.15;
        
        const riverGradient = this.ctx.createLinearGradient(0, riverY, 0, this.canvas.height);
        riverGradient.addColorStop(0, colors[3]);
        riverGradient.addColorStop(1, colors[0]);
        
        this.ctx.fillStyle = riverGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, riverY);
        
        for (let x = 0; x <= this.canvas.width; x += 10) {
            const waveHeight = Math.sin(x * 0.02) * 5;
            this.ctx.lineTo(x, riverY + waveHeight);
        }
        
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = `${colors[5]}60`;
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.canvas.width;
            const y = riverY + Math.random() * riverHeight;
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, 20, 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawToledoCityscape(colors, intensity, chaos, lineThickness = 1, buildingDensity = 1,
                       skylineComplexity = 5, textureGrain = 1) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const skyHeight = this.canvas.height * 0.35;
        this.ctx.fillStyle = colors[5];
        this.ctx.fillRect(0, skyHeight, width, height - skyHeight);

        this.drawClouds(colors, intensity, chaos);
        
        this.drawSun(colors, intensity, chaos);
        
        for (let i = 0; i < skylineComplexity; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(Math.random() * width, height);
            
            let points = [];
            const pointCount = 4 + Math.floor(chaos * 4);
            for (let j = 0; j < pointCount; j++) {
                points.push({
                    x: (width * j) / (pointCount - 1) + (Math.random() - 0.5) * 80 * chaos,
                    y: skyHeight + (Math.random() * (height - skyHeight) * 0.6 * intensity)
                });
            }
            
            this.ctx.lineTo(points[0].x, points[0].y);
            for (let j = 1; j < points.length; j++) {
                this.ctx.lineTo(points[j].x, points[j].y);
            }
            
            this.ctx.lineTo(width, height);
            this.ctx.closePath();
            
            this.ctx.fillStyle = colors[Math.floor(Math.random() * 2)];
            this.ctx.fill();
            
            if (chaos > 0.3) {
                this.ctx.lineWidth = lineThickness;
                this.addInkSplatters(points, colors[0], textureGrain);
            }
        }

        this.drawToledoBuildings(colors, intensity, chaos, buildingDensity);

        this.drawMaumeeRiver(colors);
    }
    
    addInkSplatters(points, color, textureGrain = 1) {
        points.forEach(point => {
            const splatCount = Math.floor((Math.random() * 5 + 3) * textureGrain);
            for (let i = 0; i < splatCount; i++) {
                this.ctx.beginPath();
                this.ctx.arc(
                    point.x + (Math.random() - 0.5) * 30,
                    point.y + (Math.random() - 0.5) * 30,
                    Math.random() * 3 * textureGrain,
                    0,
                    Math.PI * 2
                );
                this.ctx.fillStyle = color;
                this.ctx.fill();
            }
        });
    }
}
