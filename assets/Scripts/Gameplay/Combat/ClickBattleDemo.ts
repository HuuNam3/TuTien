import {
    _decorator,
    Button,
    Canvas,
    Color,
    Component,
    director,
    Graphics,
    Label,
    Node,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';
import { CultivationProgress, CultivationProgressSystem } from '../../Systems/CultivationProgressSystem';

const { ccclass, property } = _decorator;

const THOI_THE_MINOR_REALMS = ['Nhất tầng', 'Nhị tầng', 'Tam tầng', 'Tứ tầng', 'Ngũ tầng', 'Lục tầng', 'Thất tầng', 'Bát tầng', 'Cửu tầng'];
const THOI_THE_BASE_STATS = {
    maxHp: 85,
    maxMana: 20,
    attack: 10,
    defense: 3,
    accuracy: 0.9,
    dodgeRate: 0.05,
    blockRate: 0.08,
    blockReduction: 0.3,
    critRate: 0.05,
    critDamage: 1.5,
    cultivationRequired: 100,
};
const THOI_THE_PER_LEVEL = {
    maxHp: 13,
    maxMana: 4,
    attack: 3,
    defense: 1,
    accuracy: 0.01,
    dodgeRate: 0.005,
    blockRate: 0.01,
    cultivationRequired: 60,
};

type Fighter = {
    name: string;
    realm: string;
    minorRealm: string;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    attack: number;
    defense: number;
    accuracy: number;
    dodgeRate: number;
    blockRate: number;
    blockReduction: number;
    critRate: number;
    critDamage: number;
    cultivation: CultivationProgress;
    manaGain: number;
    skillCost: number;
    skillName: string;
    skillMultiplier: number;
    skillCooldown: number;
    skillCooldownRemaining: number;
};

type BarView = {
    graphics: Graphics;
    label: Label;
    width: number;
    height: number;
    fillColor: Color;
};

type AttackResult = {
    damage: number;
    skill: boolean;
    critical: boolean;
    dodged: boolean;
    blocked: boolean;
};

@ccclass('ClickBattleDemo')
export class ClickBattleDemo extends Component {
    @property
    public playerMaxHp = 98;

    @property
    public playerMaxMana = 24;

    @property
    public playerAttack = 13;

    @property
    public enemyMaxHp = 85;

    @property
    public enemyMaxMana = 20;

    @property
    public enemyAttack = 10;

    @property
    public maxTurns = 20;

    @property
    public turnInterval = 1.4;

    private player!: Fighter;
    private enemy!: Fighter;
    private uiRoot: Node | null = null;
    private playerNode: Node | null = null;
    private enemyNode: Node | null = null;
    private playerHpBar: BarView | null = null;
    private playerManaBar: BarView | null = null;
    private enemyHpBar: BarView | null = null;
    private enemyManaBar: BarView | null = null;
    private breakthroughPointLabel: Label | null = null;
    private turnLabel: Label | null = null;
    private logLabel: Label | null = null;
    private attackButton: Button | null = null;
    private attackButtonLabel: Label | null = null;
    private battleLogs: string[] = [];
    private isBusy = false;
    private isBattleOver = false;
    private turnCount = 0;

    protected start(): void {
        this.resetBattle();
        this.buildUi();
        this.refreshUi();
        this.writeLog('Click START to begin auto battle.');
    }

    protected onDestroy(): void {
        this.attackButton?.node.off(Button.EventType.CLICK, this.onStartClicked, this);
        this.uiRoot?.off(Node.EventType.TOUCH_END, this.onScreenClicked, this);
        this.unschedule(this.runPlayerTurn);
        this.unschedule(this.runEnemyTurn);
        this.unschedule(this.finishByTurnLimit);
    }

    private resetBattle(): void {
        this.player = this.createThoiTheFighter('Người chơi', 2);
        this.enemy = this.createThoiTheFighter('Tán tu', 2);

        this.battleLogs = [];
        this.isBusy = false;
        this.isBattleOver = false;
        this.turnCount = 0;
        this.unschedule(this.runPlayerTurn);
        this.unschedule(this.runEnemyTurn);
        this.unschedule(this.finishByTurnLimit);
    }

    private createThoiTheFighter(name: string, minorLevel: number): Fighter {
        const safeLevel = Math.max(1, Math.min(9, Math.floor(minorLevel)));
        const extraLevel = safeLevel - 1;
        const maxHp = THOI_THE_BASE_STATS.maxHp + extraLevel * THOI_THE_PER_LEVEL.maxHp;
        const maxMana = THOI_THE_BASE_STATS.maxMana + extraLevel * THOI_THE_PER_LEVEL.maxMana;
        const attack = THOI_THE_BASE_STATS.attack + extraLevel * THOI_THE_PER_LEVEL.attack;
        const defense = THOI_THE_BASE_STATS.defense + extraLevel * THOI_THE_PER_LEVEL.defense;
        const accuracy = THOI_THE_BASE_STATS.accuracy + extraLevel * THOI_THE_PER_LEVEL.accuracy;
        const dodgeRate = THOI_THE_BASE_STATS.dodgeRate + extraLevel * THOI_THE_PER_LEVEL.dodgeRate;
        const blockRate = THOI_THE_BASE_STATS.blockRate + extraLevel * THOI_THE_PER_LEVEL.blockRate;
        const cultivationRequired = THOI_THE_BASE_STATS.cultivationRequired + extraLevel * THOI_THE_PER_LEVEL.cultivationRequired;

        return {
            name,
            realm: 'Thối Thể',
            minorRealm: THOI_THE_MINOR_REALMS[safeLevel - 1],
            hp: maxHp,
            maxHp,
            mana: maxMana,
            maxMana,
            attack,
            defense,
            accuracy,
            dodgeRate,
            blockRate,
            blockReduction: THOI_THE_BASE_STATS.blockReduction,
            critRate: THOI_THE_BASE_STATS.critRate,
            critDamage: THOI_THE_BASE_STATS.critDamage,
            cultivation: CultivationProgressSystem.createProgress(cultivationRequired, 0.35),
            manaGain: maxMana * 0.1,
            skillCost: 20,
            skillName: 'Tuyệt Ảnh Kiếm',
            skillMultiplier: 1.4,
            skillCooldown: 2,
            skillCooldownRemaining: 2,
        };
    }

    private buildUi(): void {
        const canvasNode = this.resolveCanvasNode();
        const oldRoot = canvasNode.getChildByName('ClickBattleDemoRoot');
        oldRoot?.destroy();

        this.uiRoot = this.createNode(canvasNode, 'ClickBattleDemoRoot', 0, 0, 960, 540);
        this.drawBox(this.uiRoot, 960, 540, new Color(22, 26, 34, 245), new Color(75, 88, 110, 255));
        this.uiRoot.on(Node.EventType.TOUCH_END, this.onScreenClicked, this);

        this.createLabel(this.uiRoot, 'Title', 'CLICK BATTLE DEMO', 0, 228, 440, 44, 28, new Color(242, 239, 225, 255));
        this.breakthroughPointLabel = this.createLabel(
            this.uiRoot,
            'BreakthroughPointPreview',
            '',
            0,
            194,
            620,
            28,
            16,
            new Color(224, 204, 132, 255)
        );

        this.playerNode = this.createFighterPanel(
            this.uiRoot,
            this.player,
            -265,
            42,
            new Color(66, 140, 205, 255),
            true
        );
        this.enemyNode = this.createFighterPanel(
            this.uiRoot,
            this.enemy,
            265,
            42,
            new Color(190, 83, 73, 255),
            false
        );

        this.logLabel = this.createLabel(
            this.uiRoot,
            'BattleLog',
            '',
            0,
            -158,
            780,
            72,
            14,
            new Color(226, 231, 239, 255)
        );

        this.turnLabel = this.createLabel(
            this.uiRoot,
            'TurnCounter',
            '',
            0,
            -205,
            360,
            28,
            16,
            new Color(180, 195, 214, 255)
        );

        this.createAttackButton(this.uiRoot);
    }

    private resolveCanvasNode(): Node {
        let current: Node | null = this.node;
        while (current) {
            if (current.getComponent(Canvas)) {
                return current;
            }
            current = current.parent;
        }

        const scene = director.getScene();
        const existingCanvas = scene?.getComponentsInChildren(Canvas)[0]?.node;
        if (existingCanvas) {
            return existingCanvas;
        }

        if (!this.node.getComponent(UITransform)) {
            this.node.addComponent(UITransform).setContentSize(960, 540);
        }
        if (!this.node.getComponent(Canvas)) {
            this.node.addComponent(Canvas);
        }
        return this.node;
    }

    private createFighterPanel(parent: Node, fighter: Fighter, x: number, y: number, color: Color, isPlayer: boolean): Node {
        const panel = this.createNode(parent, `${fighter.name}Panel`, x, y, 280, 270);
        this.drawBox(panel, 280, 270, new Color(34, 39, 50, 255), new Color(93, 107, 128, 255));

        this.createLabel(panel, `${fighter.name}Name`, fighter.name.toUpperCase(), 0, 108, 240, 30, 21, new Color(255, 255, 255, 255));
        this.createLabel(
            panel,
            `${fighter.name}Realm`,
            `${fighter.realm} cảnh ${fighter.minorRealm}`,
            0,
            82,
            240,
            26,
            16,
            new Color(212, 224, 238, 255)
        );

        const avatar = this.createNode(panel, `${fighter.name}Avatar`, 0, 20, 98, 98);
        this.drawBox(avatar, 98, 98, color, new Color(255, 255, 255, 180));
        this.createLabel(avatar, `${fighter.name}AvatarText`, isPlayer ? 'YOU' : 'FOE', 0, 0, 96, 32, 24, new Color(255, 255, 255, 255));

        const hpBar = this.createBar(panel, `${fighter.name}HpBar`, 0, -58, 220, 24, new Color(210, 62, 73, 255));
        const manaBar = this.createBar(panel, `${fighter.name}ManaBar`, 0, -93, 220, 20, new Color(66, 135, 245, 255));
        this.createLabel(
            panel,
            `${fighter.name}Stats`,
            `Công ${fighter.attack} Thủ ${fighter.defense} Né ${this.toPercent(fighter.dodgeRate)} Đỡ ${this.toPercent(fighter.blockRate)}`,
            0,
            -122,
            220,
            24,
            15,
            new Color(208, 199, 176, 255)
        );

        if (isPlayer) {
            this.playerHpBar = hpBar;
            this.playerManaBar = manaBar;
        } else {
            this.enemyHpBar = hpBar;
            this.enemyManaBar = manaBar;
        }

        return panel;
    }

    private createAttackButton(parent: Node): void {
        const buttonNode = this.createNode(parent, 'AttackButton', 0, -246, 230, 50);
        this.drawBox(buttonNode, 230, 50, new Color(229, 169, 69, 255), new Color(255, 234, 183, 255));

        this.attackButton = buttonNode.addComponent(Button);
        this.attackButton.transition = Button.Transition.SCALE;
        this.attackButton.duration = 0.08;
        this.attackButton.zoomScale = 0.95;
        buttonNode.on(Button.EventType.CLICK, this.onStartClicked, this);

        this.attackButtonLabel = this.createLabel(
            buttonNode,
            'AttackButtonLabel',
            'START',
            0,
            0,
            210,
            42,
            22,
            new Color(46, 38, 24, 255)
        );
    }

    private onScreenClicked(): void {
        this.onStartClicked();
    }

    private onStartClicked(): void {
        if (this.isBusy) {
            return;
        }

        if (this.isBattleOver) {
            this.resetBattle();
            this.refreshUi();
            this.startAutoBattle();
            return;
        }

        this.startAutoBattle();
    }

    private startAutoBattle(): void {
        this.isBusy = true;
        this.turnCount = 0;
        this.refreshButton();
        this.writeLog('Đấu pháp bắt đầu.');
        this.scheduleOnce(this.runPlayerTurn, 0.25);
    }

    private runPlayerTurn = (): void => {
        if (!this.isBusy || this.isBattleOver) {
            return;
        }

        if (this.turnCount >= this.maxTurns) {
            this.finishByTurnLimit();
            return;
        }

        this.turnCount += 1;

        const result = this.attack(this.player, this.enemy);

        this.playStrike(this.playerNode, 1);
        this.playDamageEffect(this.enemyNode, result);
        if (result.skill) {
            this.showSkillName(this.playerNode, this.player.skillName);
        }
        this.refreshUi();
        this.writeBattleLog(this.formatAttackLog(this.player, result));

        if (this.enemy.hp <= 0) {
            this.finishBattle(`${this.player.name} thắng!`);
            return;
        }

        this.scheduleOnce(this.runEnemyTurn, this.turnInterval * 0.5);
    };

    private runEnemyTurn = (): void => {
        if (!this.isBusy || this.isBattleOver) {
            return;
        }

        const result = this.attack(this.enemy, this.player);

        this.playStrike(this.enemyNode, -1);
        this.playDamageEffect(this.playerNode, result);
        if (result.skill) {
            this.showSkillName(this.enemyNode, this.enemy.skillName);
        }
        this.refreshUi();
        this.writeBattleLog(this.formatAttackLog(this.enemy, result));

        if (this.player.hp <= 0) {
            this.finishBattle(`${this.enemy.name} thắng!`);
            return;
        }

        if (this.turnCount >= this.maxTurns) {
            this.scheduleOnce(this.finishByTurnLimit, this.turnInterval * 0.5);
            return;
        }

        this.scheduleOnce(this.runPlayerTurn, this.turnInterval);
    };

    private attack(attacker: Fighter, target: Fighter): AttackResult {
        this.recoverMana(attacker);

        const canSkill = attacker.skillCooldownRemaining <= 0 && attacker.mana >= attacker.skillCost;
        const dodged = Math.random() > this.getHitChance(attacker, target);

        if (canSkill) {
            attacker.mana = Math.max(0, attacker.mana - attacker.skillCost);
            attacker.skillCooldownRemaining = attacker.skillCooldown;
        } else {
            attacker.skillCooldownRemaining = Math.max(0, attacker.skillCooldownRemaining - 1);
        }

        if (dodged) {
            return { damage: 0, skill: canSkill, critical: false, dodged: true, blocked: false };
        }

        const skillMultiplier = canSkill ? attacker.skillMultiplier : 1;
        const critical = Math.random() < attacker.critRate;
        const critMultiplier = critical ? attacker.critDamage : 1;
        const rawDamage = Math.round(attacker.attack * skillMultiplier * this.rollDamagePercent() * critMultiplier);
        const blocked = Math.random() < target.blockRate;
        const blockMultiplier = blocked ? 1 - target.blockReduction : 1;
        const damageBeforeDefense = Math.round(rawDamage * blockMultiplier);
        const damage = Math.max(1, damageBeforeDefense - target.defense);

        target.hp = Math.max(0, target.hp - damage);

        return { damage, skill: canSkill, critical, dodged: false, blocked };
    }

    private getHitChance(attacker: Fighter, target: Fighter): number {
        return Math.max(0.1, Math.min(0.98, attacker.accuracy - target.dodgeRate));
    }

    private recoverMana(fighter: Fighter): void {
        fighter.mana = Math.min(fighter.maxMana, fighter.mana + fighter.maxMana * 0.1);
    }

    private rollDamagePercent(): number {
        return 0.95 + Math.random() * 0.1;
    }

    private finishBattle(message: string): void {
        this.isBusy = false;
        this.isBattleOver = true;
        this.unschedule(this.runPlayerTurn);
        this.unschedule(this.runEnemyTurn);
        this.unschedule(this.finishByTurnLimit);
        this.refreshUi();
        this.writeBattleLog(`${message} Click RESTART to fight again.`);
    }

    private finishByTurnLimit = (): void => {
        if (this.isBattleOver) {
            return;
        }

        if (this.player.hp > this.enemy.hp) {
            this.finishBattle(`Hết lượt. ${this.player.name} thắng nhờ sinh lực (${this.player.hp} > ${this.enemy.hp})!`);
        } else if (this.enemy.hp > this.player.hp) {
            this.finishBattle(`Hết lượt. ${this.enemy.name} thắng nhờ sinh lực (${this.enemy.hp} > ${this.player.hp})!`);
        } else {
            this.finishBattle('Hết lượt. Hòa!');
        }
    };

    private refreshUi(): void {
        this.paintBar(this.playerHpBar, this.player.hp, this.player.maxHp, 'SINH LỰC');
        this.paintBar(this.playerManaBar, this.player.mana, this.player.maxMana, 'LINH LỰC');
        this.paintBar(this.enemyHpBar, this.enemy.hp, this.enemy.maxHp, 'SINH LỰC');
        this.paintBar(this.enemyManaBar, this.enemy.mana, this.enemy.maxMana, 'LINH LỰC');
        if (this.turnLabel) {
            this.turnLabel.string = `TURN ${this.turnCount}/${this.maxTurns}`;
        }
        if (this.breakthroughPointLabel) {
            this.breakthroughPointLabel.string = `Tu vi: ${this.player.cultivation.current}/${this.player.cultivation.required} | Nhị -> Tam: +2 công điểm`;
        }
        this.refreshButton();
    }

    private refreshButton(): void {
        if (this.attackButton) {
            this.attackButton.interactable = !this.isBusy;
        }
        if (this.attackButtonLabel) {
            this.attackButtonLabel.string = this.isBattleOver ? 'RESTART' : this.isBusy ? 'FIGHTING' : 'START';
        }
    }

    private writeLog(message: string): void {
        if (this.logLabel) {
            this.logLabel.string = message;
        }
    }

    private writeBattleLog(message: string): void {
        this.battleLogs.push(message);
        this.battleLogs = this.battleLogs.slice(-3);
        this.writeLog(this.battleLogs.join('\n'));
    }

    private formatAttackLog(attacker: Fighter, result: AttackResult): string {
        const action = result.skill ? `dùng ${attacker.skillName}` : result.critical ? 'bạo kích' : 'ra đòn';
        if (result.dodged) {
            return `Lượt ${this.turnCount}: ${attacker.name} ${action}, mục tiêu né tránh.`;
        }

        const blockText = result.blocked ? ' (đỡ đòn)' : '';
        return `Lượt ${this.turnCount}: ${attacker.name} ${action} gây ${result.damage} sát thương${blockText}.`;
    }

    private toPercent(value: number): string {
        return `${Math.round(value * 100)}%`;
    }

    private playStrike(node: Node | null, direction: number): void {
        if (!node) {
            return;
        }

        const start = node.position.clone();
        tween(node)
            .to(0.09, { position: new Vec3(start.x + direction * 26, start.y, start.z) })
            .to(0.12, { position: start })
            .start();
    }

    private playDamageEffect(targetNode: Node | null, result: AttackResult): void {
        if (!targetNode) {
            return;
        }

        if (!result.dodged) {
            this.playHitShake(targetNode);
            this.playHitFlash(targetNode);
        }
        this.spawnDamageNumber(targetNode, result.damage, result.skill, result.critical, result.dodged, result.blocked);
    }

    private playHitShake(targetNode: Node): void {
        const start = targetNode.position.clone();
        tween(targetNode)
            .to(0.04, { position: new Vec3(start.x - 8, start.y + 3, start.z) })
            .to(0.04, { position: new Vec3(start.x + 8, start.y - 2, start.z) })
            .to(0.05, { position: start })
            .start();
    }

    private playHitFlash(targetNode: Node): void {
        const flash = this.createNode(targetNode, 'DamageFlash', 0, 28, 132, 132);
        const opacity = flash.addComponent(UIOpacity);
        opacity.opacity = 150;
        this.drawBox(flash, 132, 132, new Color(255, 43, 43, 145));

        tween(opacity)
            .to(0.18, { opacity: 0 })
            .call(() => flash.destroy())
            .start();
    }

    private showSkillName(sourceNode: Node | null, skillName: string): void {
        if (!sourceNode) {
            return;
        }

        const node = this.createNode(sourceNode, 'SkillName', 0, 128, 180, 38);
        const opacity = node.addComponent(UIOpacity);
        const label = node.addComponent(Label);
        label.string = skillName;
        label.fontSize = 22;
        label.lineHeight = 30;
        label.color = new Color(124, 224, 255, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        tween(node)
            .to(0.16, { scale: new Vec3(1.18, 1.18, 1) })
            .to(0.5, { position: new Vec3(0, 164, 0), scale: new Vec3(1, 1, 1) })
            .start();

        tween(opacity)
            .delay(0.3)
            .to(0.36, { opacity: 0 })
            .call(() => node.destroy())
            .start();
    }

    private spawnDamageNumber(targetNode: Node, damage: number, isSkill: boolean, isCritical: boolean, isDodged: boolean, isBlocked: boolean): void {
        const startY = 92;
        const node = this.createNode(targetNode, 'DamageNumber', 0, startY, 120, 42);
        const opacity = node.addComponent(UIOpacity);
        const label = node.addComponent(Label);
        label.string = isDodged ? 'NÉ' : isBlocked ? `ĐỠ -${damage}` : isCritical ? `BẠO -${damage}!` : isSkill ? `-${damage}!` : `-${damage}`;
        label.fontSize = isCritical ? 28 : isSkill ? 30 : 26;
        label.lineHeight = isCritical ? 36 : isSkill ? 38 : 34;
        label.color = isCritical ? new Color(255, 221, 70, 255) : isSkill ? new Color(255, 205, 64, 255) : new Color(255, 88, 88, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        tween(node)
            .to(0.12, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.38, { position: new Vec3(0, startY + 48, 0), scale: new Vec3(1, 1, 1) })
            .start();

        tween(opacity)
            .delay(0.18)
            .to(0.32, { opacity: 0 })
            .call(() => node.destroy())
            .start();
    }

    private createBar(parent: Node, name: string, x: number, y: number, width: number, height: number, fillColor: Color): BarView {
        const node = this.createNode(parent, name, x, y, width, height);
        const graphics = node.addComponent(Graphics);
        const label = this.createLabel(node, `${name}Label`, '', 0, 0, width, height, 14, new Color(255, 255, 255, 255));

        return {
            graphics,
            label,
            width,
            height,
            fillColor,
        };
    }

    private paintBar(bar: BarView | null, value: number, maxValue: number, title: string): void {
        if (!bar) {
            return;
        }

        const percent = maxValue <= 0 ? 0 : Math.max(0, Math.min(1, value / maxValue));
        const halfWidth = bar.width * 0.5;
        const halfHeight = bar.height * 0.5;
        const fillWidth = Math.max(0, (bar.width - 4) * percent);

        bar.graphics.clear();
        bar.graphics.fillColor = new Color(13, 16, 22, 255);
        bar.graphics.rect(-halfWidth, -halfHeight, bar.width, bar.height);
        bar.graphics.fill();

        bar.graphics.fillColor = bar.fillColor;
        bar.graphics.rect(-halfWidth + 2, -halfHeight + 2, fillWidth, bar.height - 4);
        bar.graphics.fill();

        bar.graphics.lineWidth = 2;
        bar.graphics.strokeColor = new Color(225, 230, 238, 170);
        bar.graphics.rect(-halfWidth, -halfHeight, bar.width, bar.height);
        bar.graphics.stroke();

        bar.label.string = `${title} ${Math.ceil(value)}/${maxValue}`;
    }

    private drawBox(node: Node, width: number, height: number, fill: Color, stroke?: Color): void {
        const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;

        graphics.clear();
        graphics.fillColor = fill;
        graphics.rect(-halfWidth, -halfHeight, width, height);
        graphics.fill();

        if (stroke) {
            graphics.lineWidth = 2;
            graphics.strokeColor = stroke;
            graphics.rect(-halfWidth, -halfHeight, width, height);
            graphics.stroke();
        }
    }

    private createNode(parent: Node, name: string, x: number, y: number, width: number, height: number): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        return node;
    }

    private createLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize: number,
        color: Color
    ): Label {
        const node = this.createNode(parent, name, x, y, width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }
}
