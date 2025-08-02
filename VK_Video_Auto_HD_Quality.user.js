// ==UserScript==
// @name         VK Video Auto HD Quality
// @namespace    https://greasyfork.org/
// @version      1.2
// @description  Скрипт для автоматического выбора качества видео на VK Видео
// @author       NoName
// @match        https://vkvideo.ru/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Константы для селекторов
    const SELECTORS = {
        VIDEO: '.videoplayer_media video',
        SETTINGS_BUTTON: '.videoplayer_controls_item.videoplayer_btn.videoplayer_btn_settings',
        QUALITY_MENU_ITEM: '.videoplayer_settings_menu_list_item',
        QUALITY_SUBLIST_ITEM: '.videoplayer_settings_menu_sublist_item',
    };

    const DESIRED_QUALITIES = ['1440p60','1440p', '1080p60', '1080p50', '1080p'];

    // Вспомогательная функция для ожидания элемента через MutationObserver
    const waitForElement = (selector) => {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect(); // Останавливаем наблюдение
                    resolve(element);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    };

    // Вспомогательная функция для ожидания элемента с текстом
    const waitForElementWithText = (selector, text) => {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (element.textContent.includes(text)) {
                        obs.disconnect(); // Останавливаем наблюдение
                        resolve(element);
                        return;
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    };

    // Вспомогательная функция для ожидания появления всех качеств
    const waitForQualitiesToLoad = () => {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                const qualityItems = document.querySelectorAll(SELECTORS.QUALITY_SUBLIST_ITEM);
                if (qualityItems.length > 1) { // Ждем, пока появится больше одного элемента (не только "Авто")
                    obs.disconnect(); // Останавливаем наблюдение
                    resolve(qualityItems);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    };

    // Основная функция для выбора качества
    const setQuality = async () => {
        try {
            console.log('Попытка установить качество:', DESIRED_QUALITIES.join(', '));

            // Ждем появления кнопки настроек
            const settingsButton = await waitForElement(SELECTORS.SETTINGS_BUTTON);
            console.log('Кнопка настроек найдена');

            // Открываем меню настроек
            settingsButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            console.log('Кнопка настроек нажата (фейково)');

            // Ждем появления пункта "Качество"
            const qualityMenuItem = await waitForElementWithText(SELECTORS.QUALITY_MENU_ITEM, 'Качество');
            console.log('Пункт "Качество" найден');

            // Открываем меню качества
            qualityMenuItem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            console.log('Пункт "Качество" нажат (фейково)');

            // Ждем появления списка качеств
            const qualityItems = await waitForQualitiesToLoad();
            console.log('Список качеств загружен');

            // Ищем нужное качество в списке
            let selectedQualityElement = null;
            for (const quality of DESIRED_QUALITIES) {
                const qualityElement = Array.from(qualityItems).find(item => item.textContent.trim() === quality);
                if (qualityElement) {
                    selectedQualityElement = qualityElement;
                    console.log('Найдено качество:', quality);
                    break;
                }
            }

            if (selectedQualityElement) {
                // Выбираем качество
                selectedQualityElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                console.log('Качество', selectedQualityElement.textContent.trim(), 'выбрано (фейково)');
            } else {
                console.error('Ни одно из желаемых качеств не найдено в списке');
            }

            // Ждем небольшой задержки перед возобновлением воспроизведения
            await new Promise(resolve => setTimeout(resolve, 500));

            // Находим элемент видео
            const videoElement = document.querySelector(SELECTORS.VIDEO);
            if (!videoElement) {
                throw new Error('Элемент видео не найден');
            }

            // Возобновляем воспроизведение видео
            if (videoElement.paused) {
                videoElement.play();
                console.log('Воспроизведение видео возобновлено');
            } else {
                console.log('Видео уже воспроизводится');
            }

        } catch (error) {
            console.error('Ошибка при установке качества:', error);
        }
    };

    // Основная функция для запуска скрипта
    const main = async () => {
        try {
            // Добавляем CSS для временного скрытия меню качества
            const hideMenuCSS = `
                .videoplayer_settings_menu_list,
                .videoplayer_settings_menu_sublist {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
            `;
            const style = document.createElement('style');
            style.type = 'text/css';
            style.id = 'hide-menu-style';
            style.appendChild(document.createTextNode(hideMenuCSS));
            document.head.appendChild(style);
            console.log('Меню качества временно скрыто');

            // Ждем появления плеера
            await waitForElement(SELECTORS.VIDEO);
            console.log('Плеер найден');

            // Ждем небольшой задержки перед выбором качества
            await new Promise(resolve => setTimeout(resolve, 500));

            // Выбираем качество
            await setQuality();

            // Восстанавливаем видимость меню качества
            const styleElement = document.getElementById('hide-menu-style');
            if (styleElement) {
                styleElement.remove();
                console.log('Видимость меню качества восстановлена');
            }

        } catch (error) {
            console.error('Ошибка в основном потоке:', error);

            // Восстанавливаем видимость меню качества в случае ошибки
            const styleElement = document.getElementById('hide-menu-style');
            if (styleElement) {
                styleElement.remove();
                console.log('Видимость меню качества восстановлена (в случае ошибки)');
            }
        }
    };

    // Запускаем скрипт сразу после загрузки страницы
    window.addEventListener('load', () => {
        console.log('Страница загружена, запускаем скрипт');
        setTimeout(main, 500); // Небольшая задержка для уверенности
    });

    // Также запускаем при изменении URL (для single-page applications)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('URL изменился, перезапускаем скрипт');
            setTimeout(main, 500);
        }
    }).observe(document, { subtree: true, childList: true });

    console.log('Скрипт для VK Видео загружен');
})();
