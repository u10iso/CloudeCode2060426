(function () {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.includes("YOUR_")) {
        document.body.innerHTML =
            '<div style="max-width:560px;margin:60px auto;padding:24px;font-family:sans-serif;border:1px solid #e1e8ed;border-radius:12px;background:#fff;">' +
            '<h2>Setup required</h2>' +
            '<p>Copy <code>config.example.js</code> to <code>config.js</code> and fill in your Supabase project URL and anon key. See <code>README.md</code> for details.</p>' +
            "</div>";
        return;
    }

    const supabase = window.supabase.createClient(cfg.url, cfg.anonKey);

    const authView = document.getElementById("authView");
    const appView = document.getElementById("appView");
    const userArea = document.getElementById("userArea");
    const userEmail = document.getElementById("userEmail");
    const signOutBtn = document.getElementById("signOutBtn");

    const authForm = document.getElementById("authForm");
    const authEmail = document.getElementById("authEmail");
    const authPassword = document.getElementById("authPassword");
    const authSubmit = document.getElementById("authSubmit");
    const authMessage = document.getElementById("authMessage");
    const authTabs = document.querySelectorAll(".auth-tab");

    const postForm = document.getElementById("postForm");
    const postContent = document.getElementById("postContent");
    const postSubmit = document.getElementById("postSubmit");
    const charCount = document.getElementById("charCount");
    const timeline = document.getElementById("timeline");
    const refreshBtn = document.getElementById("refreshBtn");

    let mode = "signin";
    let currentUser = null;

    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            authTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            mode = tab.dataset.mode;
            authSubmit.textContent = mode === "signin" ? "Sign in" : "Create account";
            setMessage("", null);
        });
    });

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        authSubmit.disabled = true;
        setMessage("処理中...", null);

        const email = authEmail.value.trim();
        const password = authPassword.value;

        try {
            if (mode === "signin") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (!data.session) {
                    setMessage("確認メールを送信しました。リンクを開いてからサインインしてください。", "success");
                    authSubmit.disabled = false;
                    return;
                }
            }
        } catch (err) {
            setMessage(err.message || "サインインに失敗しました", "error");
            authSubmit.disabled = false;
        }
    });

    signOutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
    });

    postContent.addEventListener("input", () => {
        const len = postContent.value.length;
        charCount.textContent = `${len} / 280`;
        charCount.classList.toggle("over", len > 280);
        postSubmit.disabled = len === 0 || len > 280;
    });

    postForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = postContent.value.trim();
        if (!content || !currentUser) return;

        postSubmit.disabled = true;
        const { error } = await supabase
            .from("posts")
            .insert({ content, user_id: currentUser.id, author_email: currentUser.email });

        if (error) {
            alert("投稿に失敗しました: " + error.message);
            postSubmit.disabled = false;
            return;
        }

        postContent.value = "";
        charCount.textContent = "0 / 280";
        await loadTimeline();
        postSubmit.disabled = false;
    });

    refreshBtn.addEventListener("click", loadTimeline);

    supabase.auth.onAuthStateChange((_event, session) => {
        applySession(session);
    });

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    function applySession(session) {
        currentUser = session?.user ?? null;
        if (currentUser) {
            authView.classList.add("hidden");
            appView.classList.remove("hidden");
            userArea.classList.remove("hidden");
            userEmail.textContent = currentUser.email;
            authForm.reset();
            setMessage("", null);
            loadTimeline();
        } else {
            authView.classList.remove("hidden");
            appView.classList.add("hidden");
            userArea.classList.add("hidden");
            userEmail.textContent = "";
            authSubmit.disabled = false;
        }
    }

    async function loadTimeline() {
        timeline.innerHTML = '<li class="empty">読み込み中...</li>';
        const { data, error } = await supabase
            .from("posts")
            .select("id, content, created_at, user_id, author_email")
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) {
            timeline.innerHTML = `<li class="empty">読み込みに失敗しました: ${escapeHtml(error.message)}</li>`;
            return;
        }
        if (!data || data.length === 0) {
            timeline.innerHTML = '<li class="empty">まだ投稿がありません</li>';
            return;
        }

        timeline.innerHTML = data.map(renderTweet).join("");
        timeline.querySelectorAll("[data-delete]").forEach((btn) => {
            btn.addEventListener("click", () => deletePost(btn.dataset.delete));
        });
    }

    function renderTweet(post) {
        const isMine = currentUser && post.user_id === currentUser.id;
        const author = post.author_email || "anonymous";
        const time = formatTime(post.created_at);
        const deleteBtn = isMine
            ? `<div class="tweet-actions"><button class="tweet-delete" data-delete="${post.id}">Delete</button></div>`
            : "";
        return `
            <li class="tweet">
                <div class="tweet-header">
                    <span class="tweet-author">${escapeHtml(author)}</span>
                    <span>${time}</span>
                </div>
                <div class="tweet-content">${escapeHtml(post.content)}</div>
                ${deleteBtn}
            </li>
        `;
    }

    async function deletePost(id) {
        if (!confirm("この投稿を削除しますか?")) return;
        const { error } = await supabase.from("posts").delete().eq("id", id);
        if (error) {
            alert("削除に失敗しました: " + error.message);
            return;
        }
        await loadTimeline();
    }

    function setMessage(text, kind) {
        authMessage.textContent = text;
        authMessage.classList.remove("error", "success");
        if (kind) authMessage.classList.add(kind);
    }

    function formatTime(iso) {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now - d;
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return `${diffSec}秒前`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}分前`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH}時間前`;
        return d.toLocaleString();
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[c]);
    }
})();
