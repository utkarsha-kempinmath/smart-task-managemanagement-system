# UML Sequence Diagram & Communication (Collaboration) Diagram Specification
## SmartTask — Intelligent Academic Task & Schedule Planner (MERN Architecture)

---

## 1. Executive Summary & Architectural Overview

The **SmartTask System** is a full-stack MERN (MongoDB, Express, React, Node.js) platform designed to solve student task overwhelm through pure algorithmic scheduling, deadline proximity heuristics, and deep work tracking. 

To model the dynamic interactions and structural collaborations of the system, this document provides formal UML specifications for two complementary behavioral diagrams from the **UML 2.5 standard**:
1. **UML Sequence Diagrams**: Emphasizing the **chronological sequence** of message exchanges across lifelines over time.
2. **UML Communication (formerly Collaboration) Diagrams**: Emphasizing the **structural relationships and object links** through which numbered messages pass.

Both diagram types describe the same underlying interactions (semantic isomorphism) but present them through complementary perspectives.

```
+---------------------------------------------------------------------------------------+
|                               SmartTask System Layers                                 |
+---------------------------------------------------------------------------------------+
|  [Presentation Layer]     React Client (Views, State Context, Vite, Axios)             |
|                                     │                                                 |
|  [API / Controller Layer] Express Routers & Controllers (Auth, Task, Schedule, Focus)  |
|                                     │                                                 |
|  [Domain / Engine Layer]  Algorithmic Services (TaskAnalyzer, Scheduler, Reminders)   |
|                                     │                                                 |
|  [Persistence Layer]      Mongoose ODM Schemas & MongoDB Database                     |
+---------------------------------------------------------------------------------------+
```

---

## 2. In-Depth Technical Details: Sequence Diagrams

### 2.1 Definition and Purpose
A **Sequence Diagram** is an interaction diagram that details how operations are carried out—what messages are sent and when. Sequence diagrams are organized according to time. The time sequence of messages is seen by reading down the page.

### 2.2 Key Elements and Notations
- **Actor**: An external entity (e.g., `Student`, `Administrator`) that interacts with the system.
- **Lifeline**: Represents an individual participant in the interaction, drawn as a vertical dashed line descending from a labeled rectangle (`Name : Class`).
- **Activation Bar (Focus of Control)**: A thin vertical rectangle superimposed on a lifeline indicating when an object is actively executing an operation or waiting for a sub-routine to return.
- **Messages**:
  - **Synchronous Call (`―>>`)**: The sender suspends execution and waits for the message to be processed and acknowledged.
  - **Asynchronous Message (`-―)`)**: The sender continues execution without waiting for a reply.
  - **Reply / Return Message (`-->>`)**: Returns execution control and optional data back to the caller.
  - **Self-Message**: An object calling one of its own internal methods.
- **Combined Fragments (Interaction Frames)**:
  - `opt` (Optional): Executes only if a boolean guard condition evaluates to true.
  - `alt` (Alternative): Branching logic analogous to `if-else`.
  - `loop` (Iteration): Repeated message execution over a collection or while a condition is satisfied.
  - `par` (Parallel): Concurrent executions occurring simultaneously.

---

## 3. In-Depth Technical Details: Communication (Collaboration) Diagrams

### 3.1 Definition and Purpose
A **Communication Diagram** (designated as *Collaboration Diagram* in UML 1.x and renamed in UML 2.x) is an interaction diagram that focuses on the **structural organization of objects** that send and receive messages. Rather than dedicating a distinct vertical lifeline to time, objects are arranged as nodes in a graph with connection links (associations) representing paths along which messages flow.

### 3.2 Key Elements and Notations
- **Objects / Roles**: Depicted as rectangular boxes with the syntax `instanceName : ClassName` or `:ClassName` for anonymous instances.
- **Association Links**: Solid lines connecting collaborating objects indicating a communication pathway (such as object reference, dependency, or network connection).
- **Numbered Messages with Direction Arrows**:
  - Messages are rendered adjacent to the association line with a directional arrow (`->` or `<-`).
  - **Nested Decimal Numbering Scheme**: Conveys chronological sequence and nested call depth:
    - Top-level message: `1: initiateAction()`
    - Sub-calls invoked during execution of 1: `1.1: validate()`, `1.2: calculate()`, `1.2.1: checkThreshold()`
    - Subsequent independent action: `2: returnStatus()`
  - **Return Values and Parameters**: Specified in the format `sequenceNumber: returnVar := methodName(arguments)`.

---

## 4. Comparative Matrix: Sequence vs. Communication Diagrams

| Feature / Dimension | UML Sequence Diagram | UML Communication Diagram |
|---|---|---|
| **Primary Focus** | Chronological ordering of events and message timing | Structural coupling, relationships, and object collaboration topology |
| **Time Representation** | Vertical axis running strictly downwards | Explicit nested sequence numbers (`1`, `1.1`, `1.2`, `2`, etc.) |
| **Object Layout** | Horizontally spaced lifelines along the top | Free-form spatial graph of interconnected object nodes |
| **Object Lifecycles** | Explicit creation (`<<create>>`) and destruction (`X`) points | Creation/destruction notated via message text or stereotype constraints |
| **Control Logic** | Clearly segmented via visual frames (`opt`, `alt`, `loop`, `par`) | Guard conditions and iteration prefixes (e.g. `1.1 [status=='active']: update()`) |
| **Space Scalability** | Consumes vertical space rapidly as steps increase | Consumes 2D space; compact for complex multi-object webs |
| **Optimal Use Case** | Validating specific use-case scenarios, API handshakes, and call stacks | Refactoring, analyzing object coupling, and architectural structural validation |

---

## 5. UML Sequence Diagrams for SmartTask

### 5.1 Sequence Diagram 1: Task Creation, Algorithmic Analysis & In-App Alert Triggering

This sequence captures the core workflow of creating a task. The `TaskAnalyzer` heuristic engine evaluates deadline proximity and effort to determine the dynamic **Smart Priority Score (0–160)** and **Eisenhower Matrix quadrant** prior to persistence, followed by the notification subsystem scheduling reminders.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (User)
    participant UI as TaskForm / TasksView (React)
    participant AuthMW as AuthMiddleware (JWT)
    participant TC as TaskController (Express)
    participant TA as TaskAnalyzer (Service Engine)
    participant TM as Task (Mongoose Model)
    participant RS as ReminderService (Service)
    participant DB as MongoDB Database

    Student ->> UI: Fill form (Title, Deadline, Priority, EstTime) & click "Save Task"
    activate UI
    UI ->> AuthMW: POST /api/tasks (Payload + Bearer Token)
    activate AuthMW
    
    AuthMW ->> AuthMW: verifyToken(token) & extract user._id
    alt Token Invalid / Expired
        AuthMW -->> UI: 401 Unauthorized
        UI -->> Student: Display session expiry alert & redirect to login
    else Token Valid
        AuthMW ->> TC: next() -> invoke createTask(req, res)
        activate TC
    end
    deactivate AuthMW

    TC ->> TC: Validate required fields (title, category, deadline)
    opt Validation Failure
        TC -->> UI: 400 Bad Request ("Title, category, deadline required")
    end

    TC ->> TA: analyzeTask(taskData)
    activate TA
    Note over TA: Compute Deadline Proximity Score<br/>Add User Priority Weight<br/>Factor Estimated Effort & Overdue Multiplier<br/>Map to Eisenhower Matrix Quadrant
    TA -->> TC: return { smartPriorityScore, smartQuadrant, smartRecommendation }
    deactivate TA

    TC ->> TM: create({ ...taskData, smartPriorityScore, smartQuadrant, ... })
    activate TM
    TM ->> DB: insertOne(taskDocument)
    activate DB
    DB -->> TM: acknowledgeInserted(taskRecord)
    deactivate DB
    TM -->> TC: taskInstance
    deactivate TM

    TC ->> TM: findById(task._id).populate('category')
    activate TM
    TM ->> DB: queryWithJoin(category)
    activate DB
    DB -->> TM: populatedDoc
    deactivate DB
    TM -->> TC: populatedTask
    deactivate TM

    TC ->> RS: syncInAppRemindersForStudent(studentId)
    activate RS
    RS ->> TM: find({ student: studentId, status: { $ne: 'completed' } })
    activate TM
    TM ->> DB: queryPendingTasks()
    activate DB
    DB -->> TM: pendingTaskList
    deactivate DB
    TM -->> RS: pendingTasks
    deactivate TM

    loop For each upcoming deadline < 24h
        RS ->> DB: upsertNotification()
        activate DB
        DB -->> RS: alertAcknowledge
        deactivate DB
    end
    RS -->> TC: remindersSynchronized
    deactivate RS

    TC -->> UI: 201 Created (populatedTask JSON)
    deactivate TC
    UI ->> UI: Update Redux/Context Task State & Trigger Confetti/Toast
    UI -->> Student: Render new Task in Eisenhower Matrix & Active Task List
    deactivate UI
```

---

### 5.2 Sequence Diagram 2: Automated Smart Schedule Generation (Time-Blocking Engine)

This sequence illustrates how the algorithmic **Scheduler Engine** packs uncompleted deliverables into cognitive focus blocks and break intervals based on user preferences.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (User)
    participant UI as ScheduleView (React)
    participant SC as ScheduleController (Express)
    participant SS as SchedulerService (Algorithmic Engine)
    participant UM as User (Mongoose Model)
    participant TM as Task (Mongoose Model)
    participant SM as Schedule (Mongoose Model)
    participant DB as MongoDB Database

    Student ->> UI: Click "Generate Daily Schedule" (Date, Start/End hour, Block duration)
    activate UI
    UI ->> SC: POST /api/schedule/generate { date, startHour, endHour, blockDuration }
    activate SC

    SC ->> SS: generateSmartScheduleForStudent(studentId, date, options)
    activate SS

    SS ->> UM: findById(studentId)
    activate UM
    UM ->> DB: queryUserPrefs()
    activate DB
    DB -->> UM: studentProfile { studyPreferences }
    deactivate DB
    UM -->> SS: studentDocument
    deactivate UM

    SS ->> TM: find({ student: studentId, status: { $ne: 'completed' } }).sort({ smartPriorityScore: -1 })
    activate TM
    TM ->> DB: queryAndSortByScore()
    activate DB
    DB -->> TM: prioritizedTaskList
    deactivate DB
    TM -->> SS: pendingTasks
    deactivate TM

    Note over SS: Initialize Timeline (startHour to endHour)<br/>Calculate Available Time vs Required Time<br/>Determine Feasibility: "optimal", "heavy", or "overloaded"

    loop While currentMinute + 30 <= endMinute
        SS ->> SS: Allocate Focus Study Block (e.g. 50-60 min)
        SS ->> SS: Assign highest priority pending task & decrement its remaining duration
        opt Task fully allotted (remaining <= 15 min)
            SS ->> SS: Advance pointer to next pending task
        end
        opt Time remaining before endMinute >= breakMinutes
            SS ->> SS: Allocate Cognitive Reset Break Block (10-15 min)
        end
    end

    SS ->> SM: findOneAndUpdate({ student: studentId, date }, newScheduleData, { upsert: true, new: true })
    activate SM
    SM ->> DB: upsertScheduleDocument()
    activate DB
    DB -->> SM: persistedScheduleRecord
    deactivate DB
    SM -->> SS: savedSchedule
    deactivate SM

    SS -->> SC: return savedSchedule
    deactivate SS

    SC -->> UI: 200 OK (Schedule JSON with time slots & feasibility score)
    deactivate SC
    UI ->> UI: Render interactive visual timeline & metrics
    UI -->> Student: Display Daily Schedule with Time Blocks & Break Indicators
    deactivate UI
```

---

### 5.3 Sequence Diagram 3: Deep Work / Pomodoro Focus Session Lifecycle & Task Time Logging

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (User)
    participant UI as FocusView / Timer (React & Web Audio)
    participant FC as FocusController (Express)
    participant FSM as FocusSession (Mongoose Model)
    participant TM as Task (Mongoose Model)
    participant RS as ReminderService (Service)
    participant DB as MongoDB Database

    Student ->> UI: Select Target Task & Click "Start Focus Session"
    activate UI
    UI ->> FC: POST /api/focus/start { taskId, notes }
    activate FC
    FC ->> FSM: create({ student, task: taskId, startTime: now(), status: 'active' })
    activate FSM
    FSM ->> DB: insertFocusSession()
    activate DB
    DB -->> FSM: sessionRecord
    deactivate DB
    FSM -->> FC: activeSession
    deactivate FSM
    FC -->> UI: 201 Created (activeSession data with sessionId)
    deactivate FC

    UI ->> UI: Start Countdown Clock & Disable Distraction Panels
    Note over Student, UI: Deep Work Interval Runs (e.g. 25-50 min)
    
    Student ->> UI: Timer Expires / Click "Complete Session"
    UI ->> UI: Play Web Audio Acoustic Chime & Trigger Confetti
    UI ->> FC: POST /api/focus/complete { sessionId, durationMinutes, notes, status: 'completed' }
    activate FC

    FC ->> FSM: findOne({ _id: sessionId, student })
    activate FSM
    FSM ->> DB: querySession()
    activate DB
    DB -->> FSM: sessionDoc
    deactivate DB
    FSM -->> FC: sessionDoc
    deactivate FSM

    FC ->> FC: Calculate total duration & set endTime = now()
    FC ->> FSM: session.save()
    activate FSM
    FSM ->> DB: updateSession()
    activate DB
    DB -->> FSM: acknowledge
    deactivate DB
    FSM -->> FC: updatedSession
    deactivate FSM

    opt Session was tied to a Task (taskId != null)
        FC ->> TM: findByIdAndUpdate(taskId, { $inc: { actualTimeSpent: durationMinutes } })
        activate TM
        TM ->> DB: incrementField(actualTimeSpent)
        activate DB
        DB -->> TM: updatedTaskDoc
        deactivate DB
        TM -->> FC: taskUpdated
        deactivate TM
    end

    FC ->> RS: createInAppAlert(studentId, { title: 'Focus Completed', severity: 'success' })
    activate RS
    RS ->> DB: insertNotificationRecord()
    activate DB
    DB -->> RS: notificationSaved
    deactivate DB
    RS -->> FC: alertCreated
    deactivate RS

    FC -->> UI: 200 OK (Completed session summary)
    deactivate FC
    UI ->> UI: Update Focus Statistics & Refresh Task Time Spent
    UI -->> Student: Display "Session Completed" modal with milestone summary
    deactivate UI
```

---

## 6. UML Communication (Collaboration) Diagrams for SmartTask

### 6.1 Communication Diagram 1: Task Management & Algorithmic Priority Assessment

```mermaid
flowchart TD
    classDef actorStyle fill:#27272a,stroke:#059669,stroke-width:2px,color:#f4f4f5;
    classDef clientStyle fill:#18181b,stroke:#3b82f6,stroke-width:2px,color:#f4f4f5;
    classDef controllerStyle fill:#18181b,stroke:#8b5cf6,stroke-width:2px,color:#f4f4f5;
    classDef serviceStyle fill:#18181b,stroke:#f59e0b,stroke-width:2px,color:#f4f4f5;
    classDef modelStyle fill:#18181b,stroke:#ec4899,stroke-width:2px,color:#f4f4f5;
    classDef dbStyle fill:#09090b,stroke:#10b981,stroke-width:2px,color:#f4f4f5;

    Student["Student (User)"]:::actorStyle
    Client["ReactApp : TaskView"]:::clientStyle
    Controller["TaskController : Express"]:::controllerStyle
    Analyzer["TaskAnalyzer : Engine"]:::serviceStyle
    TaskModel["Task : Mongoose Model"]:::modelStyle
    ReminderSvc["ReminderService"]:::serviceStyle
    NotifModel["Notification : Model"]:::modelStyle
    DB[("MongoDB Database")]:::dbStyle

    Student ---|"1: submitTaskForm(data) &rarr;"| Client
    Client ---|"2: POST /api/tasks &rarr;<br/>7: 201 Created &larr;"| Controller
    Controller ---|"3: smartAnalysis := analyzeTask(data) &rarr;"| Analyzer
    Controller ---|"4: create(taskData) &rarr;<br/>4.3: populatedDoc := findById() &rarr;"| TaskModel
    TaskModel ---|"4.1: insertDocument() &rarr;<br/>4.2: queryPopulate() &rarr;"| DB
    Controller ---|"5: syncInAppReminders(studentId) &rarr;"| ReminderSvc
    ReminderSvc ---|"5.1: findPendingTasks() &rarr;"| TaskModel
    ReminderSvc ---|"5.2: upsertDeadlineAlert() &rarr;"| NotifModel
    NotifModel ---|"5.3: writeNotification() &rarr;"| DB
    Client ---|"8: renderTaskInMatrix() &rarr;"| Student
```

---

### 6.2 Communication Diagram 2: Smart Daily Schedule Planner & Time-Blocking Engine

```mermaid
flowchart TD
    classDef actorStyle fill:#27272a,stroke:#059669,stroke-width:2px,color:#f4f4f5;
    classDef clientStyle fill:#18181b,stroke:#3b82f6,stroke-width:2px,color:#f4f4f5;
    classDef controllerStyle fill:#18181b,stroke:#8b5cf6,stroke-width:2px,color:#f4f4f5;
    classDef serviceStyle fill:#18181b,stroke:#f59e0b,stroke-width:2px,color:#f4f4f5;
    classDef modelStyle fill:#18181b,stroke:#ec4899,stroke-width:2px,color:#f4f4f5;
    classDef dbStyle fill:#09090b,stroke:#10b981,stroke-width:2px,color:#f4f4f5;

    Student["Student (User)"]:::actorStyle
    Client["ReactApp : ScheduleView"]:::clientStyle
    Controller["ScheduleController : Express"]:::controllerStyle
    SchedulerSvc["SchedulerService : Engine"]:::serviceStyle
    UserModel["User : Mongoose Model"]:::modelStyle
    TaskModel["Task : Mongoose Model"]:::modelStyle
    ScheduleModel["Schedule : Mongoose Model"]:::modelStyle
    DB[("MongoDB Database")]:::dbStyle

    Student ---|"1: requestDailySchedule(date, prefs) &rarr;"| Client
    Client ---|"2: POST /api/schedule/generate &rarr;<br/>6: 200 OK (scheduleData) &larr;"| Controller
    Controller ---|"3: generateSmartSchedule(studentId, date, options) &rarr;"| SchedulerSvc
    SchedulerSvc ---|"3.1: findById(studentId) &rarr;"| UserModel
    UserModel ---|"3.2: queryUserPreferences() &rarr;"| DB
    SchedulerSvc ---|"3.3: findPendingTasksSortedByScore() &rarr;"| TaskModel
    TaskModel ---|"3.4: queryPrioritizedTasks() &rarr;"| DB
    SchedulerSvc ---|"3.5: packTimeSlotsAndBreaks() &rarr;<br/>3.6: calculateFeasibilityScore() &rarr;"| SchedulerSvc
    SchedulerSvc ---|"4: findOneAndUpdate({student, date}, data, upsert) &rarr;"| ScheduleModel
    ScheduleModel ---|"4.1: persistScheduleDocument() &rarr;"| DB
    SchedulerSvc ---|"5: return generatedScheduleDoc &rarr;"| Controller
    Client ---|"7: displayTimeBlocksAndFeasibility() &rarr;"| Student
```

---

### 6.3 Communication Diagram 3: Deep Work Focus Session & Milestone Logging

```mermaid
flowchart TD
    classDef actorStyle fill:#27272a,stroke:#059669,stroke-width:2px,color:#f4f4f5;
    classDef clientStyle fill:#18181b,stroke:#3b82f6,stroke-width:2px,color:#f4f4f5;
    classDef controllerStyle fill:#18181b,stroke:#8b5cf6,stroke-width:2px,color:#f4f4f5;
    classDef serviceStyle fill:#18181b,stroke:#f59e0b,stroke-width:2px,color:#f4f4f5;
    classDef modelStyle fill:#18181b,stroke:#ec4899,stroke-width:2px,color:#f4f4f5;
    classDef dbStyle fill:#09090b,stroke:#10b981,stroke-width:2px,color:#f4f4f5;

    Student["Student (User)"]:::actorStyle
    Client["ReactApp : FocusTimer"]:::clientStyle
    Controller["FocusController : Express"]:::controllerStyle
    FocusModel["FocusSession : Mongoose Model"]:::modelStyle
    TaskModel["Task : Mongoose Model"]:::modelStyle
    ReminderSvc["ReminderService"]:::serviceStyle
    NotifModel["Notification : Model"]:::modelStyle
    DB[("MongoDB Database")]:::dbStyle

    Student ---|"1: completeFocusSession(notes) &rarr;"| Client
    Client ---|"1.1: playAcousticChime() &rarr;<br/>2: POST /api/focus/complete &rarr;<br/>6: 200 OK (sessionData) &larr;"| Controller
    Controller ---|"3: updateSessionStatusAndDuration() &rarr;"| FocusModel
    FocusModel ---|"3.1: saveCompletedSession() &rarr;"| DB
    Controller ---|"4: incrementActualTimeSpent(duration) &rarr;"| TaskModel
    TaskModel ---|"4.1: findByIdAndUpdate() &rarr;"| DB
    Controller ---|"5: createInAppAlert(successPayload) &rarr;"| ReminderSvc
    ReminderSvc ---|"5.1: createNotification() &rarr;"| NotifModel
    NotifModel ---|"5.2: insertAlertRecord() &rarr;"| DB
    Client ---|"7: renderMilestoneModalAndRefreshStats() &rarr;"| Student
```

---

## 7. Implementation Traceability Matrix

| UML Message Step | Operation / Endpoint | Source Code File Reference |
|---|---|---|
| **Task Creation API** | `POST /api/tasks` | `backend/routes/taskRoutes.js` |
| **Smart Priority Calculation** | `analyzeTask(taskData)` | `backend/services/taskAnalyzer.js` |
| **Task Document Insertion** | `Task.create(taskData)` | `backend/controllers/taskController.js (L28)` |
| **Deadline Proximity Alerts** | `syncInAppRemindersForStudent(id)` | `backend/services/reminderService.js (L50)` |
| **Daily Schedule API** | `POST /api/schedule/generate` | `backend/routes/scheduleRoutes.js` |
| **Time-Blocking Algorithm** | `generateSmartScheduleForStudent()` | `backend/services/schedulerService.js (L13)` |
| **Schedule Persistence** | `Schedule.findOneAndUpdate(..., { upsert: true })` | `backend/services/schedulerService.js (L114)` |
| **Focus Session Lifecycle** | `POST /api/focus/start` & `/complete` | `backend/controllers/focusController.js` |
| **Task Cumulative Hours** | `Task.findByIdAndUpdate({ $inc: { actualTimeSpent } })` | `backend/controllers/focusController.js (L38)` |
