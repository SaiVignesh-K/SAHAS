import React from 'react';
import './Home.css';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="home-container">
            <div className="intro-banner">
                <h1>Welcome to SAHAS CODE STUDIO</h1>
                <p>Empowering coders to excel in C and C++</p>
            </div>

            <div className="sections-container">
                <div className="section-card">
                    <h2>Arena</h2>
                    <p>Explore and solve coding problems in our curated arena.</p>
                    <button className="explore-button">
                        <Link to="/Arena">Arena</Link>
                    </button>
                </div>
                <div className="section-card">
                    <h2>Code Playground</h2>
                    <p>Practice and hone your coding skills with our powerful editor.</p>
                    <button className="explore-button">
                        <Link to="/Playground">Start Coding</Link>
                    </button>
                </div>
                <div className="section-card">
                    <h2>Battle Ground</h2>
                    <p>Compete in real-time coding battles and prove your skills.</p>
                    <button className="explore-button"><Link to="/Battleground">Enter Battle Ground</Link></button>
                </div>
            </div>

            <footer className="footer">
                <p>&copy; 2024 SAHAS CODE STUDIO</p>
                <p>Team: Sai Vignesh, Harshitha, Shanmukh</p>
                <p>Mentor: Mohamadsohil Momin</p>
                <p>Powered by Tally Solutions Hackathon</p>
            </footer>
        </div>
    );
}

export default Home;
