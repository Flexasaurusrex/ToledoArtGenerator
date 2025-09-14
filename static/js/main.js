document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generateBtn');
    const intensitySlider = document.getElementById('intensity');
    const chaosSlider = document.getElementById('chaos');
    const lineThicknessSlider = document.getElementById('lineThickness');
    const buildingDensitySlider = document.getElementById('buildingDensity');
    const skylineComplexitySlider = document.getElementById('skylineComplexity');
    const textureGrainSlider = document.getElementById('textureGrain');
    const colorIntensitySlider = document.getElementById('colorIntensity');
    const hueAdjustSlider = document.getElementById('hueAdjust');
    const colorToneSelect = document.getElementById('colorTone');
    const redSculptureToggle = document.getElementById('redSculptureToggle');
    const glassToledoToggle = document.getElementById('glassToledoToggle');
    const mudHensToggle = document.getElementById('mudHensToggle');
    const toledoMuseumToggle = document.getElementById('toledoMuseumToggle');
    const gallery = document.getElementById('gallery');
    
    const canvas = new ToledoArtCanvas('previewCanvas');
    
    let selectedImages = new Set();
    
    const loadHistory = async () => {
        try {
            const response = await fetch('/history');
            const artworks = await response.json();
            
            const existingToggle = document.getElementById('toggleHistory');
            if (existingToggle) {
                existingToggle.parentElement.remove();
            }
            const existingHistory = document.querySelector('.history-section');
            if (existingHistory) {
                existingHistory.remove();
            }

            if (artworks.length > 0) {
                const historySection = document.createElement('div');
                historySection.className = 'history-section mt-5';
                historySection.innerHTML = '<h3>Previously Generated Art</h3>';
                
                const historyGallery = document.createElement('div');
                historyGallery.className = 'gallery mt-3';
                
                artworks.forEach(artwork => {
                    const div = document.createElement('div');
                    div.className = 'gallery-item';
                    
                    const img = document.createElement('img');
                    img.src = artwork.image_path;
                    img.alt = `Generated on ${new Date(artwork.created_at).toLocaleDateString()}`;
                    img.className = 'img-fluid';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'image-select';
                    checkbox.dataset.path = artwork.image_path;
                    checkbox.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            selectedImages.add(artwork.image_path);
                        } else {
                            selectedImages.delete(artwork.image_path);
                        }
                        updateExportOptions();
                    });
                    
                    const downloadBtn = document.createElement('a');
                    downloadBtn.className = 'btn btn-sm btn-secondary mt-2';
                    downloadBtn.textContent = 'Download';
                    downloadBtn.href = artwork.image_path;
                    downloadBtn.download = `toledo-art-${artwork.id}.png`;
                    
                    const controls = document.createElement('div');
                    controls.className = 'image-controls';
                    controls.appendChild(checkbox);
                    controls.appendChild(downloadBtn);
                    
                    div.appendChild(img);
                    div.appendChild(controls);
                    historyGallery.appendChild(div);
                });
                
                const exportControls = document.createElement('div');
                exportControls.className = 'export-controls mt-3';
                exportControls.innerHTML = `
                    <select id="historyExportFormat" class="form-select" style="width: auto; display: inline-block; margin-right: 10px;">
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                    </select>
                    <button id="historyBatchExportBtn" class="btn btn-primary" disabled>Export Selected</button>
                `;
                
                historySection.appendChild(historyGallery);
                historySection.appendChild(exportControls);

                const toggleContainer = document.createElement('div');
                toggleContainer.className = 'text-center mb-3';
                toggleContainer.innerHTML = `
                    <button id="toggleHistory" class="btn btn-secondary">
                        Show Previous Artwork
                    </button>
                `;
                document.querySelector('main').appendChild(toggleContainer);
                document.querySelector('main').appendChild(historySection);

                const toggleBtn = document.getElementById('toggleHistory');
                historySection.style.display = 'none';
                toggleBtn.textContent = 'Show Previous Artwork';

                toggleBtn.addEventListener('click', () => {
                    const isVisible = historySection.style.display !== 'none';
                    historySection.style.display = isVisible ? 'none' : 'block';
                    toggleBtn.textContent = isVisible ? 'Show Previous Artwork' : 'Hide Previous Artwork';
                });
                
                document.getElementById('historyBatchExportBtn').addEventListener('click', handleBatchExport);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };
    
    const handleBatchExport = async () => {
        const format = document.querySelector('.export-controls:not([style*="none"]) #exportFormat, #historyExportFormat').value;
        const selectedPaths = Array.from(selectedImages);
        
        if (selectedPaths.length === 0) {
            alert('Please select images to export');
            return;
        }
        
        try {
            const response = await fetch('/export-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_paths: selectedPaths,
                    format: format
                })
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = '';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert('Error exporting images: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error exporting images. Please try again.');
        }
    };
    
    const updateExportOptions = () => {
        const exportBtns = document.querySelectorAll('#batchExportBtn, #historyBatchExportBtn');
        exportBtns.forEach(btn => {
            if (btn) {
                btn.disabled = selectedImages.size === 0;
            }
        });
    };
    
    const updatePreview = () => {
        canvas.updatePreview({
            intensity: intensitySlider.value,
            chaos: chaosSlider.value,
            lineThickness: lineThicknessSlider.value,
            buildingDensity: buildingDensitySlider.value,
            skylineComplexity: skylineComplexitySlider.value,
            textureGrain: textureGrainSlider.value,
            colorIntensity: colorIntensitySlider.value,
            hueAdjust: hueAdjustSlider.value,
            colorTone: colorToneSelect.value,
            redSculpture: redSculptureToggle.checked,
            glassToledo: glassToledoToggle.checked,
            mudHens: mudHensToggle.checked,
            toledoMuseum: toledoMuseumToggle.checked
        });

        document.querySelectorAll('.control-group').forEach(group => {
            const slider = group.querySelector('.slider');
            const display = group.querySelector('.value-display');
            if (slider && display) {
                let value = slider.value;
                if (slider.id === 'intensity' || slider.id === 'chaos') {
                    value = `${Math.round(value * 100)}%`;
                } else if (slider.id === 'skylineComplexity') {
                    value = Math.round(value);
                } else if (slider.id === 'hueAdjust') {
                    value = `${value}°`;
                } else {
                    value = `${value}x`;
                }
                display.textContent = value;
            }
        });
    };
    
    [
        intensitySlider,
        chaosSlider,
        lineThicknessSlider,
        buildingDensitySlider,
        skylineComplexitySlider,
        textureGrainSlider,
        colorIntensitySlider,
        hueAdjustSlider,
        colorToneSelect,
        redSculptureToggle,
        glassToledoToggle,
        mudHensToggle,
        toledoMuseumToggle
    ].forEach(element => {
        element.addEventListener('change', updatePreview);
        element.addEventListener('input', updatePreview);
    });
    
    generateBtn.addEventListener('click', async function() {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        const formData = new FormData();
        formData.append('intensity', intensitySlider.value);
        formData.append('chaos', chaosSlider.value);
        formData.append('color_tone', colorToneSelect.value);
        formData.append('lineThickness', lineThicknessSlider.value);
        formData.append('buildingDensity', buildingDensitySlider.value);
        formData.append('skylineComplexity', skylineComplexitySlider.value);
        formData.append('textureGrain', textureGrainSlider.value);
        formData.append('colorIntensity', colorIntensitySlider.value);
        formData.append('hueAdjust', hueAdjustSlider.value);
        formData.append('redSculpture', redSculptureToggle.checked);
        formData.append('glassToledo', glassToledoToggle.checked);
        formData.append('mudHens', mudHensToggle.checked);
        formData.append('toledoMuseum', toledoMuseumToggle.checked);
        
        const previewCanvas = document.getElementById('previewCanvas');
        const canvasData = previewCanvas.toDataURL('image/png');
        formData.append('canvas_data', canvasData);
        
        try {
            const response = await fetch('/generate', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                gallery.innerHTML = '';
                
                const img = data.images[0];
                const div = document.createElement('div');
                div.className = 'gallery-item';
                
                const canvasWrapper = document.createElement('div');
                canvasWrapper.style.width = '100%';
                canvasWrapper.style.height = 'auto';
                canvasWrapper.style.position = 'relative';
                
                const imgElement = document.createElement('img');
                imgElement.src = img.image;
                imgElement.className = 'generated-canvas';
                imgElement.width = 1200;
                imgElement.height = 1200;
                canvasWrapper.appendChild(imgElement);
                div.appendChild(canvasWrapper);
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'image-select';
                checkbox.dataset.path = img.image;
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedImages.add(e.target.dataset.path);
                    } else {
                        selectedImages.delete(e.target.dataset.path);
                    }
                    updateExportOptions();
                });
                
                const downloadBtn = document.createElement('a');
                downloadBtn.className = 'btn btn-sm btn-secondary mt-2';
                downloadBtn.textContent = 'Download';
                downloadBtn.href = img.image;
                downloadBtn.download = `toledo-art-${img.id}.png`;
                
                const controls = document.createElement('div');
                controls.className = 'image-controls';
                controls.appendChild(checkbox);
                controls.appendChild(downloadBtn);
                div.appendChild(controls);
                gallery.appendChild(div);
                
                if (!document.querySelector('.export-controls')) {
                    const exportControls = document.createElement('div');
                    exportControls.className = 'export-controls mt-3';
                    exportControls.innerHTML = `
                        <select id="exportFormat" class="form-select" style="width: auto; display: inline-block; margin-right: 10px;">
                            <option value="png">PNG</option>
                            <option value="jpg">JPG</option>
                        </select>
                        <button id="batchExportBtn" class="btn btn-primary" disabled>Export Selected</button>
                    `;
                    gallery.appendChild(exportControls);
                    
                    document.getElementById('batchExportBtn').addEventListener('click', handleBatchExport);
                }
                
                loadHistory();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Art';
        }
    });
    
    updatePreview();
    setTimeout(() => {
        updatePreview();
    }, 100);
    loadHistory();
});
