(function () {

    const theme = localStorage.getItem("swapreads-theme");

    if (theme === "dark") {

        document.documentElement.classList.add("dark-theme");

    }

})();