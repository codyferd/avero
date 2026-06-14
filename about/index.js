            const { createApp, ref } = Vue;

            createApp({
                setup() {
                    const activeTab = ref("about");
                    // Buttons moved to the end
                    const tabs = ["about", "online", "cats", "loaf", "buttons"];

                    const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

                    const getTabLabel = (tab) => {
                        const labels = {
                            about: "About",
                      online: "Socials",
                      cats: "Cats",
                      loaf: "Discord",
                      buttons: "Buttons"
                        };
                        return labels[tab];
                    };

                    const imageButtons = ref([
                        { image: "button.avif", url: "https://codyferd.github.io/avero" },
                    ]);

                    const socialLinks = [
                        { name: "GitHub", label: "codyferd", url: "https://github.com/codyferd" },
                        { name: "YouTube", label: "polycat.codyferd", url: "https://www.youtube.com/@Polycat.Codyferd" },
                        { name: "Mastodon", label: "codyferd@mastodon.social", url: "https://mastodon.social/@codyferd" },
                        { name: "Facebook", label: "Luca Ferdinand", url: "https://www.facebook.com/profile.php?id=61555933292391" },
                        { name: "Instagram", label: "kodyferd", url: "https://www.instagram.com/kodyferd/" },
                        { name: "Threads", label: "kodyferd", url: "https://www.threads.com/@kodyferd" },
                        { name: "Reddit", label: "Ornery_Present2560", url: "https://www.reddit.com/user/Ornery_Present2560/" },
                        { name: "Discord", label: "codyferd_81960" },
                        { name: "Snapchat", label: "codyferdpolycat" },
                        { name: "Email", label: "lucarappferdinand@gmail.com" },
                    ];

                    return { activeTab, tabs, getTabLabel, openExternal, socialLinks, imageButtons };
                }
            }).mount("#app");
