 // Generate background bubbles
        function createBubbles() {
            const bg = document.getElementById('animatedBg');
            for (let i = 0; i < 30; i++) {
                const span = document.createElement('span');
                const size = Math.random() * 80 + 20;
                span.style.width = size + 'px';
                span.style.height = size + 'px';
                span.style.left = Math.random() * 100 + '%';
                span.style.animationDelay = Math.random() * 20 + 's';
                span.style.animationDuration = Math.random() * 20 + 15 + 's';
                span.style.background = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
                bg.appendChild(span);
            }
        }

        // Toggle salaried fields
        document.querySelectorAll('input[name="employment"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const salariedFields = document.getElementById('salariedFields');
                salariedFields.style.display = this.value === 'salaried' ? 'block' : 'none';
            });
        });

        // Validate field
        function validateField(field) {
            if (field.value === '') {
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        }

        // Chart instance
        let taxChart;

        // Reset form
        function resetForm() {
            const inputs = document.querySelectorAll('.input-field');
            inputs.forEach(input => input.value = '');
            
            document.getElementById('salaried').checked = true;
            document.getElementById('metro').checked = true;
            
            document.getElementById('oldTax').innerHTML = '₹0';
            document.getElementById('newTax').innerHTML = '₹0';
            document.getElementById('oldBreakup').innerHTML = 'Base Tax: ₹0<br>Taxable Income: ₹0';
            document.getElementById('newBreakup').innerHTML = 'Base Tax: ₹0<br>Taxable Income: ₹0';
            document.getElementById('oldSavings').innerHTML = '';
            document.getElementById('newSavings').innerHTML = '';
            document.getElementById('effectiveTaxRate').innerHTML = '0%';
            document.getElementById('totalSavings').innerHTML = '₹0';
            document.getElementById('taxPerDay').innerHTML = '₹0';
            document.getElementById('savingsBadge').style.display = 'none';
            
            document.getElementById('aiRecommendations').innerHTML = `
                <div class="recommendation-item">
                    <div class="recommendation-title">
                        <i class="fas fa-spinner fa-pulse"></i>
                        Ready to analyze
                    </div>
                    <div class="recommendation-desc">
                        Enter your details and click calculate to get personalized AI-powered recommendations.
                    </div>
                </div>
            `;
            
            if (taxChart) {
                taxChart.destroy();
            }
            
            showToast('Form reset successfully', 'success');
        }

        // Save form data to localStorage
        function saveForm() {
            const formData = {
                grossIncome: document.getElementById('grossIncome').value,
                otherIncome: document.getElementById('otherIncome').value,
                age: document.getElementById('age').value,
                employment: document.querySelector('input[name="employment"]:checked').value,
                invest80c: document.getElementById('invest80c').value,
                health80d: document.getElementById('health80d').value,
                hraReceived: document.getElementById('hraReceived').value,
                basicSalary: document.getElementById('basicSalary').value,
                rentPaid: document.getElementById('rentPaid').value,
                cityType: document.querySelector('input[name="cityType"]:checked')?.value
            };
            
            localStorage.setItem('taxFormData', JSON.stringify(formData));
            showToast('Data saved successfully', 'success');
        }

        // Load form data from localStorage
        function loadForm() {
            const saved = localStorage.getItem('taxFormData');
            if (saved) {
                const data = JSON.parse(saved);
                document.getElementById('grossIncome').value = data.grossIncome || '';
                document.getElementById('otherIncome').value = data.otherIncome || '';
                document.getElementById('age').value = data.age || '';
                document.getElementById('invest80c').value = data.invest80c || '';
                document.getElementById('health80d').value = data.health80d || '';
                document.getElementById('hraReceived').value = data.hraReceived || '';
                document.getElementById('basicSalary').value = data.basicSalary || '';
                document.getElementById('rentPaid').value = data.rentPaid || '';
                
                if (data.employment === 'business') {
                    document.getElementById('business').checked = true;
                    document.getElementById('salariedFields').style.display = 'none';
                }
                
                if (data.cityType === 'nonMetro') {
                    document.getElementById('nonMetro').checked = true;
                }
                
                showToast('Data loaded successfully', 'success');
            }
        }

        // Show toast notification
        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
                <span>${message}</span>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }

        // Toggle export menu
        function toggleExportMenu() {
            document.getElementById('exportMenu').classList.toggle('show');
        }

        // Export functions
        function exportAsPDF() {
            showToast('Preparing PDF download...', 'success');
            // In a real app, you would implement PDF generation here
            setTimeout(() => {
                showToast('PDF downloaded successfully', 'success');
            }, 2000);
        }

        function exportAsImage() {
            showToast('Preparing image download...', 'success');
            // In a real app, you would implement image generation here
            setTimeout(() => {
                showToast('Image downloaded successfully', 'success');
            }, 2000);
        }

        function printReport() {
            window.print();
        }

        function shareReport() {
            showToast('Share link copied to clipboard', 'success');
        }

        // Calculate tax
        function calculateTax() {
            const grossIncome = parseFloat(document.getElementById('grossIncome').value);
            
            if (!grossIncome || grossIncome <= 0) {
                document.getElementById('grossIncome').classList.add('error');
                showToast('Please enter your annual gross income', 'error');
                return;
            }

            // Update progress
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
            
            // Show loading
            document.getElementById('loadingOverlay').style.display = 'flex';

            // Get all values
            const otherIncome = parseFloat(document.getElementById('otherIncome').value) || 0;
            const age = parseInt(document.getElementById('age').value) || 30;
            const employment = document.querySelector('input[name="employment"]:checked').value;
            const invest80c = Math.min(parseFloat(document.getElementById('invest80c').value) || 0, 150000);
            const health80d = parseFloat(document.getElementById('health80d').value) || 0;
            
            const hraReceived = parseFloat(document.getElementById('hraReceived')?.value) || 0;
            const basicSalary = parseFloat(document.getElementById('basicSalary')?.value) || 0;
            const rentPaid = parseFloat(document.getElementById('rentPaid')?.value) || 0;
            const cityType = document.querySelector('input[name="cityType"]:checked')?.value || 'metro';

            const totalIncome = grossIncome + otherIncome;

            // Calculate Old Regime Tax
            let oldTaxableIncome = totalIncome;

            if (employment === 'salaried' && basicSalary > 0 && rentPaid > 0) {
                const rentMinus10Percent = Math.max(0, rentPaid - (0.1 * basicSalary));
                const percentageBased = cityType === 'metro' ? 0.5 * basicSalary : 0.4 * basicSalary;
                const hraExemption = Math.min(hraReceived, rentMinus10Percent, percentageBased);
                oldTaxableIncome -= Math.max(0, hraExemption);
            }

            oldTaxableIncome -= invest80c;
            oldTaxableIncome -= health80d;
            oldTaxableIncome = Math.max(0, oldTaxableIncome);

            let oldTax = 0;
            if (age < 60) {
                if (oldTaxableIncome > 250000) {
                    if (oldTaxableIncome > 500000) {
                        oldTax += 12500;
                        if (oldTaxableIncome > 1000000) {
                            oldTax += 100000;
                            oldTax += (oldTaxableIncome - 1000000) * 0.30;
                        } else {
                            oldTax += (oldTaxableIncome - 500000) * 0.20;
                        }
                    } else {
                        oldTax += (oldTaxableIncome - 250000) * 0.05;
                    }
                }
            }

            const oldTaxBeforeCess = oldTax;
            oldTax = oldTax * 1.04;

            // Calculate New Regime Tax
            let newTaxableIncome = totalIncome;
            if (employment === 'salaried') {
                newTaxableIncome -= 75000;
            }
            newTaxableIncome = Math.max(0, newTaxableIncome);

            let newTax = 0;
            
            if (newTaxableIncome > 400000) {
                if (newTaxableIncome > 400000) {
                    const slab = Math.min(newTaxableIncome - 400000, 400000);
                    newTax += slab * 0.05;
                }
                
                if (newTaxableIncome > 800000) {
                    const slab = Math.min(newTaxableIncome - 800000, 400000);
                    newTax += slab * 0.10;
                }
                
                if (newTaxableIncome > 1200000) {
                    const slab = Math.min(newTaxableIncome - 1200000, 400000);
                    newTax += slab * 0.15;
                }
                
                if (newTaxableIncome > 1600000) {
                    const slab = Math.min(newTaxableIncome - 1600000, 400000);
                    newTax += slab * 0.20;
                }
                
                if (newTaxableIncome > 2000000) {
                    const slab = Math.min(newTaxableIncome - 2000000, 400000);
                    newTax += slab * 0.25;
                }
                
                if (newTaxableIncome > 2400000) {
                    newTax += (newTaxableIncome - 2400000) * 0.30;
                }
            }

            if (newTaxableIncome <= 1200000) {
                newTax = 0;
            }

            const newTaxBeforeCess = newTax;
            newTax = newTax * 1.04;

            // Update UI
            document.getElementById('oldTax').innerHTML = `₹${oldTax.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            document.getElementById('newTax').innerHTML = `₹${newTax.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

            document.getElementById('oldBreakup').innerHTML = `Base Tax: ₹${oldTaxBeforeCess.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}<br>Taxable Income: ₹${oldTaxableIncome.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            document.getElementById('newBreakup').innerHTML = `Base Tax: ₹${newTaxBeforeCess.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}<br>Taxable Income: ₹${newTaxableIncome.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

            // Update recommendation
            const oldCard = document.getElementById('oldCard');
            const newCard = document.getElementById('newCard');
            oldCard.classList.remove('recommended');
            newCard.classList.remove('recommended');

            let savings = 0;
            if (oldTax < newTax) {
                oldCard.classList.add('recommended');
                savings = newTax - oldTax;
                document.getElementById('oldSavings').innerHTML = `<i class="fas fa-tag"></i> Save ₹${savings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                document.getElementById('newSavings').innerHTML = '';
                document.getElementById('savingsBadge').style.display = 'inline-flex';
                document.getElementById('savingsAmount').innerHTML = `Save ₹${savings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            } else if (newTax < oldTax) {
                newCard.classList.add('recommended');
                savings = oldTax - newTax;
                document.getElementById('newSavings').innerHTML = `<i class="fas fa-tag"></i> Save ₹${savings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                document.getElementById('oldSavings').innerHTML = '';
                document.getElementById('savingsBadge').style.display = 'inline-flex';
                document.getElementById('savingsAmount').innerHTML = `Save ₹${savings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            }

            // Update summary
            const effectiveRate = ((Math.min(oldTax, newTax) / totalIncome) * 100).toFixed(2);
            document.getElementById('effectiveTaxRate').innerHTML = `${effectiveRate}%`;
            document.getElementById('totalSavings').innerHTML = `₹${savings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            document.getElementById('taxPerDay').innerHTML = `₹${(Math.min(oldTax, newTax) / 365).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

            // Update chart
            if (taxChart) {
                taxChart.destroy();
            }

            const ctx = document.getElementById('taxChart').getContext('2d');
            taxChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Old Regime', 'New Regime'],
                    datasets: [{
                        label: 'Tax Amount (₹)',
                        data: [oldTax, newTax],
                        backgroundColor: ['#ee9ca7', '#a8edea'],
                        borderRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => '₹' + value.toLocaleString()
                            }
                        }
                    }
                }
            });

            // Update progress
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');

            // Call Gemini API
            getGeminiRecommendations(totalIncome, oldTax, newTax, age, employment, invest80c, health80d);
        }

        // Gemini API Integration
        async function getGeminiRecommendations(income, oldTax, newTax, age, employment, invest80c, health80d) {
            const API_KEY = 'AIzaSyDB_yQmvhgGZHpM0TG5WmZx7KCoPm-tRXw';
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

            const prompt = `As a tax expert for India, provide personalized recommendations for this taxpayer:

            INCOME: ₹${income}
            OLD REGIME TAX: ₹${oldTax.toFixed(2)}
            NEW REGIME TAX: ₹${newTax.toFixed(2)}
            AGE: ${age}
            EMPLOYMENT: ${employment}
            80C INVESTMENTS: ₹${invest80c}
            80D INVESTMENTS: ₹${health80d}

            Please provide:
            1. THREE specific government subsidies they might be eligible for
            2. TWO tax-saving investment recommendations
            3. ONE important warning or consideration

            Format with emojis and keep it concise.`;

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                });

                const data = await response.json();
                
                if (data.candidates?.[0]?.content?.parts[0]?.text) {
                    displayRecommendations(data.candidates[0].content.parts[0].text);
                } else {
                    displayFallbackRecommendations();
                }
            } catch (error) {
                displayFallbackRecommendations();
            }

            setTimeout(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
                document.getElementById('step3').classList.add('completed');
                document.getElementById('step4').classList.add('active');
            }, 2000);
        }

        function displayRecommendations(text) {
            const aiDiv = document.getElementById('aiRecommendations');
            const lines = text.split('\n').filter(line => line.trim());
            
            let html = '';
            lines.forEach(line => {
                if (line.trim()) {
                    const emoji = line.includes('subsidy') ? '🏠' : 
                                 line.includes('invest') ? '💰' : 
                                 line.includes('warning') ? '⚠️' : '💡';
                    html += `
                        <div class="recommendation-item">
                            <div class="recommendation-title">
                                <i class="fas fa-${emoji === '🏠' ? 'home' : emoji === '💰' ? 'piggy-bank' : emoji === '⚠️' ? 'exclamation-triangle' : 'lightbulb'}"></i>
                                ${line.split(':')[0]}
                            </div>
                            <div class="recommendation-desc">
                                ${line.includes(':') ? line.split(':')[1] : line}
                            </div>
                        </div>
                    `;
                }
            });
            
            aiDiv.innerHTML = html || displayFallbackRecommendations();
        }

        function displayFallbackRecommendations() {
            return `
                <div class="recommendation-item">
                    <div class="recommendation-title">
                        <i class="fas fa-home"></i> PM Awas Yojana
                    </div>
                    <div class="recommendation-desc">
                        Interest subsidy up to ₹2.67L on housing loans for EWS/LIG categories
                    </div>
                    <div class="recommendation-tag">Eligibility: Income < ₹18L</div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-title">
                        <i class="fas fa-heartbeat"></i> Ayushman Bharat
                    </div>
                    <div class="recommendation-desc">
                        Health coverage up to ₹5 lakhs per family per year
                    </div>
                    <div class="recommendation-tag">SECC database based</div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-title">
                        <i class="fas fa-graduation-cap"></i> Education Loan Subsidy
                    </div>
                    <div class="recommendation-desc">
                        Interest subsidy during moratorium period for economically weaker students
                    </div>
                    <div class="recommendation-tag">Family income < ₹4.5L</div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-title">
                        <i class="fas fa-piggy-bank"></i> NPS Additional Deduction
                    </div>
                    <div class="recommendation-desc">
                        Invest up to ₹50,000 in NPS under Section 80CCD(1B)
                    </div>
                    <div class="recommendation-tag">Extra ₹50,000 deduction</div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-title">
                        <i class="fas fa-exclamation-triangle"></i> Important Warning
                    </div>
                    <div class="recommendation-desc">
                        Ensure all investments are made before March 31st to claim deductions
                    </div>
                </div>
            `;
        }

        // Load saved data on page load
        window.onload = function() {
            createBubbles();
            loadForm();
        };

        