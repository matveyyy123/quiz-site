// ========== ПРОВЕРКА, ЧТОБЫ НЕ ПОДКЛЮЧАТЬ ДВАЖДЫ ==========
if (typeof window.QuizTest === 'undefined') {

console.log('🎵 Скрипт загружен');

// Создаем звук
const testAudio = new Audio('sounds/button-click.mp3');
testAudio.volume = 0.5;

// Отключаем все стандартные переходы и делаем свои
document.addEventListener('DOMContentLoaded', function() {
    // Находим все кликабельные элементы
    const clickableElements = document.querySelectorAll('a, .test-card, [onclick]');
    
    clickableElements.forEach(el => {
        // Запоминаем старый обработчик
        const oldOnClick = el.onclick;
        
        // Убираем старый обработчик
        el.onclick = null;
        
        // Добавляем свой
        el.addEventListener('click', function(e) {
            e.preventDefault(); // Отменяем стандартное действие
            e.stopPropagation();
            
            console.log('🔊 Играем звук...');
            
            // Проигрываем звук
            testAudio.currentTime = 0;
            testAudio.play()
                .then(() => {
                    console.log('✅ Звук сыграл, переходим...');
                    
                    // Через 150мс переходим по ссылке
                    setTimeout(() => {
                        if (el.tagName === 'A' && el.href) {
                            window.location.href = el.href;
                        } else if (el.classList.contains('test-card')) {
                            // Для карточек тестов
                            const testPage = el.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                            if (testPage) {
                                window.location.href = testPage;
                            } else {
                                // Если не получилось, просто переходим по старому методу
                                if (oldOnClick) oldOnClick.call(el, e);
                            }
                        } else if (oldOnClick) {
                            oldOnClick.call(el, e);
                        }
                    }, 150);
                })
                .catch(err => {
                    console.log('❌ Ошибка звука, переходим сразу');
                    if (el.tagName === 'A' && el.href) {
                        window.location.href = el.href;
                    } else if (oldOnClick) {
                        oldOnClick.call(el, e);
                    }
                });
        });
    });
    
    // Обработка для обычных кнопок (без перехода)
    document.querySelectorAll('button:not([onclick])').forEach(btn => {
        btn.addEventListener('click', function() {
            testAudio.currentTime = 0;
            testAudio.play().catch(() => {});
        });
    });
    
    console.log(`👂 Звук добавлен на ${clickableElements.length} элементов`);
});

console.log('👂 Обработчик кликов установлен');

// ========== ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ ==========
const BIN_ID = '69973f9243b1c97be98c0147';
const API_KEY = '$2a$10$3VBTO7IC6S078pmAh4WZHeFeAWJV8.6zZY/AlSTRdSRgdGBBRniie';

// Загрузка данных из облака
async function loadCloudData() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        const data = await response.json();
        const cloudData = data.record;
        
        // ПОЛУЧАЕМ ЛОКАЛЬНЫЕ ДАННЫЕ
        const localStats = JSON.parse(localStorage.getItem('quizStats')) || {};
        const localRatings = JSON.parse(localStorage.getItem('testRatings')) || {};
        
        // ОБЪЕДИНЯЕМ: берем максимальные значения из облака и локальных
        if (cloudData.stats) {
            const mergedStats = { ...cloudData.stats };
            
            // Добавляем локальные, если их нет в облаке или они больше
            for (let key in localStats) {
                if (!mergedStats[key] || localStats[key] > mergedStats[key]) {
                    mergedStats[key] = localStats[key];
                }
            }
            
            localStorage.setItem('quizStats', JSON.stringify(mergedStats));
            console.log('📊 Статистика объединена:', mergedStats);
        } else {
            // Если в облаке нет статистики, сохраняем локальную
            localStorage.setItem('quizStats', JSON.stringify(localStats));
        }
        
        // Объединяем рейтинги
        if (cloudData.ratings) {
            const mergedRatings = { ...cloudData.ratings };
            
            for (let key in localRatings) {
                if (!mergedRatings[key]) {
                    mergedRatings[key] = localRatings[key];
                } else {
                    // Если есть и там и там - берем с большим количеством оценок
                    if (localRatings[key].count > mergedRatings[key].count) {
                        mergedRatings[key] = localRatings[key];
                    }
                }
            }
            
            localStorage.setItem('testRatings', JSON.stringify(mergedRatings));
        } else {
            localStorage.setItem('testRatings', JSON.stringify(localRatings));
        }
        
        console.log('✅ Данные загружены из облака и объединены');
        
        // Обновляем счетчики на главной
        if (window.updateTestCounters) {
            window.updateTestCounters();
        }
        
        // Сохраняем объединенные данные обратно в облако
        setTimeout(saveCloudData, 1000);
        
    } catch (e) {
        console.log('⚠️ Не удалось загрузить из облака, используем локальные данные');
    }
}
// Сохранение данных в облако
let isSaving = false; // Добавь эту переменную вверху файла

async function saveCloudData() {
    if (isSaving) return; // Если уже сохраняем - выходим
    isSaving = true;
    
    const stats = JSON.parse(localStorage.getItem('quizStats')) || {};
    const ratings = JSON.parse(localStorage.getItem('testRatings')) || {};
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ stats, ratings })
        });
        
        if (response.ok) {
            console.log('✅ Данные сохранены в облако');
        }
    } catch (e) {
        console.log('⚠️ Не удалось сохранить в облако');
    } finally {
        setTimeout(() => { isSaving = false; }, 1000); // Разблокируем через секунду
    }
}

// Перехватываем сохранение в localStorage
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // Если меняются наши данные - сохраняем в облако
    if (key === 'quizStats' || key === 'testRatings') {
        setTimeout(saveCloudData, 500);
    }
};

// Загружаем данные при старте
setTimeout(loadCloudData, 500);

// Класс для создания теста
class QuizTest {
    constructor(totalQuestions, results, backgroundColors, testId) {
        this.currentQuestion = 1;
        this.totalQuestions = totalQuestions;
        this.answers = [];
        this.results = results;
        this.backgroundColors = backgroundColors;
        this.testId = testId;
        this.isTransitioning = false; // Защита от двойных переходов
    }

    // Добавить метод для сохранения оценки
    saveRating(rating) {
        const ratings = JSON.parse(localStorage.getItem('testRatings')) || {};
        if (!ratings[this.testId]) {
            ratings[this.testId] = { sum: 0, count: 0, average: 0 };
        }
        
        ratings[this.testId].sum += rating;
        ratings[this.testId].count += 1;
        ratings[this.testId].average = ratings[this.testId].sum / ratings[this.testId].count;
        
        localStorage.setItem('testRatings', JSON.stringify(ratings));
        
        // Сохраняем в облако (перехватчик сам сработает, но на всякий случай)
        console.log('⭐ Оценка сохранена');
    }

    // Обновление прогресс-бара
    updateProgress() {
        const progress = document.getElementById('progress');
        if (progress) {
            const percent = ((this.currentQuestion - 1) / this.totalQuestions) * 100;
            progress.style.width = percent + '%';
        }
    }

    // Обновление статистики прохождений
    updateTestStats() {
        let stats = JSON.parse(localStorage.getItem('quizStats')) || {};
        stats[this.testId] = (stats[this.testId] || 0) + 1;
        localStorage.setItem('quizStats', JSON.stringify(stats));
        console.log(`📊 Статистика теста "${this.testId}" обновлена`);
    }

    // Смена фона
    changeBackground(num) {
        document.body.className = '';
        if (num === 'result') {
            document.body.classList.add('bg-result');
            document.body.style.setProperty('--spot-color', '#667eea');
        } else {
            document.body.classList.add(this.backgroundColors[num]);
            document.body.style.setProperty('--spot-color', this.getColorForQuestion(num));
        }
    }

    // Получить цвет для пятна
    getColorForQuestion(num) {
        const colors = ['#ff6b6b', '#a18cd1', '#84fab0', '#fbc2eb', '#f6d365', 
                       '#ffb2b2', '#b98cd1', '#c584fa', '#ffcc99', '#99ccff'];
        return colors[num-1] || '#ff6b6b';
    }

    // Показать следующий вопрос (исправлено от множественных переходов)
    showNextQuestion() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        if (this.currentQuestion < this.totalQuestions) {
            const currentId = `question${this.currentQuestion}`;
            const currentEl = document.getElementById(currentId);
            if (currentEl) currentEl.classList.remove('active');
            
            this.currentQuestion++;
            
            const nextId = `question${this.currentQuestion}`;
            const nextEl = document.getElementById(nextId);
            if (nextEl) nextEl.classList.add('active');
            
            this.changeBackground(this.currentQuestion);
            this.updateProgress();
            
            setTimeout(() => {
                this.isTransitioning = false;
            }, 300);
        } else {
            this.showResult();
            this.isTransitioning = false;
        }
    }

    // Подсчет результата
    calculateResult() {
        const counts = {};
        this.answers.forEach(a => counts[a] = (counts[a] || 0) + 1);
        
        let resultKey = Object.keys(this.results)[0];
        let max = 0;
        for (let a in counts) {
            if (counts[a] > max) {
                max = counts[a];
                resultKey = a;
            }
        }
        return resultKey;
    }

    // Показать результат
    showResult() {
        this.updateTestStats();
        
        for (let i = 1; i <= this.totalQuestions; i++) {
            const el = document.getElementById(`question${i}`);
            if (el) el.classList.remove('active');
        }
        
        this.changeBackground('result');
        
        const resultCard = document.getElementById('result');
        resultCard.classList.add('active');
        
        const resultKey = this.calculateResult();
        const res = this.results[resultKey];
        
        document.body.style.setProperty('--spot-color', res.color);
        document.getElementById('result-content').innerHTML = `
            <div class="result-details" style="background: ${res.color}">
                <div class="result-emoji">${res.emoji}</div>
                <h3>${res.title}</h3>
                <p>${res.desc}</p>
            </div>
        `;
        
        document.getElementById('progress').style.width = '100%';
    }

    // Перезапуск
    restart() {
        this.currentQuestion = 1;
        this.answers = [];
        
        document.getElementById('result').classList.remove('active');
        
        for (let i = 1; i <= this.totalQuestions; i++) {
            const el = document.getElementById(`question${i}`);
            if (el) el.classList.remove('active');
        }
        document.getElementById('question1').classList.add('active');
        
        this.changeBackground(1);
        document.getElementById('progress').style.width = '0%';
        
        // Разблокируем звезды
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.classList.remove('selected');
        });
    }

    // Инициализация
    init() {
        document.querySelectorAll('.answer-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.answers.push(button.dataset.value);
                
                button.style.transform = 'scale(0.95)';
                setTimeout(() => button.style.transform = '', 200);
                
                setTimeout(() => this.showNextQuestion(), 200);
            });
        });

        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        this.changeBackground(1);
        this.updateProgress();
    }
}

// Делаем класс глобальным
window.QuizTest = QuizTest;

} // Конец проверки if (typeof window.QuizTest === 'undefined')

// ========== ПРИМЕНЕНИЕ ТЕМЫ ПРИ ЗАГРУЗКЕ ==========
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
})();