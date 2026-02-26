// public/js/globals.js - v26.1: 全局变量与核心状态 (含安全密钥)
const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d'); const socket = io(); const TILE_SIZE = 32;

const roleName = document.getElementById('role-name'); const roleStats = document.getElementById('role-stats'); const statusText = document.getElementById('status-text');
const rollBtn = document.getElementById('roll-btn'); const endBtn = document.getElementById('end-btn'); const trapBtn = document.getElementById('trap-btn'); const controlBtn = document.getElementById('control-btn'); const abilityBtn = document.getElementById('ability-btn');
const prayBtn = document.getElementById('pray-btn'); const horseBtn = document.getElementById('horse-btn');
const weatherBadge = document.getElementById('weather-badge'); const invContainer = document.getElementById('inv-container'); const shopArea = document.getElementById('shop-area');
const missionBar = document.getElementById('mission-bar'); const sideQuestBar = document.getElementById('side-quest-bar'); const logsDiv = document.getElementById('game-logs');
const targetOverlay = document.getElementById('target-overlay'); const targetTip = document.getElementById('target-tip'); const buffContainer = document.getElementById('buff-container');
const roleSelectionDiv = document.getElementById('role-selection'); const roleButtonsContainer = document.getElementById('role-buttons-container');
const playerAvatarDiv = document.getElementById('player-avatar'); const playerAvatarName = document.getElementById('player-avatar-name'); const dpadContainer = document.getElementById('dpad-container');
const devCodeInput = document.getElementById('dev-code'); const unlockDevBtn = document.getElementById('btn-unlock-dev'); const devControls = document.getElementById('dev-controls'); const startAutoBtn = document.getElementById('btn-start-auto');
const spectatorScoreboard = document.getElementById('spectator-scoreboard'); const scoreboardList = document.getElementById('scoreboard-list');
const targetScoreInput = document.getElementById('target-score-input'); const btnSetScore = document.getElementById('btn-set-score'); const currentTargetScore = document.getElementById('current-target-score');
const gameOverOverlay = document.getElementById('game-over-overlay'); const winnerText = document.getElementById('winner-text');

let players = {}; let zones = {}; let itemsInfo = {}; let rolesConfig = {}; let manualInfo = {}; let myId = null; let currentTurnId = null; let turnPhase = 'WAITING';
let plantedSeeds = []; let groundItems = []; let traps = []; let takenRoles = []; let activeGlobalEvents = { invisible: 0, boarsRound: 0, sandstorm: 0, flood: 0 }; let boars = []; let guards = []; let waterWalls = []; let dayPhaseIndex = 0;
let mapImage = new Image(); let mapLoaded = false; let selectionMode = null;

let unlockAvatars = false; 
let currentSecretKey = ''; // === 新增：用于记录验证通过的密钥，防止前端抓包 ===
let chatHistory = []; 

function isSafeZoneClient(x, y) { for(let k in zones) { let r = zones[k].range; if(x >= r[0] && x <= r[1] && y >= r[2] && y <= r[3]) { return (k.includes('dorm') || k === 'canteen' || k.includes('class') || k === 'church'); } } return false; }
function getMyZone(p) { for(let k in zones) { let r = zones[k].range; if(p.x >= r[0] && p.x <= r[1] && p.y >= r[2] && p.y <= r[3]) return k; } return null; }