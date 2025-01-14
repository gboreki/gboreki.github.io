class LeaderboardManager {
    constructor() {
        this.maxEntries = 10;
        this.storageKey = 'columnsLeaderboard';
        this.leaderboard = this.loadLeaderboard();
    }

    loadLeaderboard() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            return [];
        }
    }

    saveLeaderboard() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.leaderboard));
            return true;
        } catch (error) {
            console.error('Error saving leaderboard:', error);
            return false;
        }
    }

    addScore(name, score) {
        const entry = {
            name: name.trim(),
            score: score,
            date: new Date().toISOString()
        };

        this.leaderboard.push(entry);
        
        // Sort by score in descending order
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top scores
        if (this.leaderboard.length > this.maxEntries) {
            this.leaderboard = this.leaderboard.slice(0, this.maxEntries);
        }

        return this.saveLeaderboard();
    }

    getScores() {
        return this.leaderboard;
    }

    isHighScore(score) {
        if (this.leaderboard.length < this.maxEntries) {
            return true;
        }
        return score > this.leaderboard[this.leaderboard.length - 1].score;
    }

    clearLeaderboard() {
        this.leaderboard = [];
        return this.saveLeaderboard();
    }
}

export default LeaderboardManager; 