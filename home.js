window.onload = () => {
    const titleContainers = document.querySelectorAll('.titleContainer');
    const machineryLeft = document.querySelector('.machineryLeft');
    const machineryRight = document.querySelector('.machineryRight');

    titleContainers.forEach((titleContainer) => {
        if (titleContainer.firstElementChild) {
            titleContainer.insertBefore(machineryLeft.cloneNode(true), titleContainer.firstElementChild);
        }

        if (titleContainer.lastElementChild) {
            titleContainer.appendChild(machineryRight.cloneNode(true), titleContainer);
        }
    });

    const applicationContainer = document.getElementById('applicationContainer');
    const footerHeader = document.querySelector('.footerHeader');
    const clonedFooterHeader = footerHeader.cloneNode(true);
    const projectTabs = document.querySelectorAll('.tabsContainer .tab');

    clonedFooterHeader.style.fill = "var(--primaryBackground)";
    clonedFooterHeader.style.width = "30vw";
    clonedFooterHeader.style.margin = "0vw 30vw 5vw 30vw";


    applicationContainer.appendChild(clonedFooterHeader);

    projectTabs.forEach((tab) => {
        if (tab.firstElementChild) {
            const clonedHeaderTab = footerHeader.cloneNode(true);
            tab.insertBefore(clonedHeaderTab, tab.firstElementChild);
            clonedHeaderTab.style.width = "100%";
            clonedHeaderTab.style.height = "max-content";
            clonedHeaderTab.style.marginBottom = "1vw";
        }
    });
}
