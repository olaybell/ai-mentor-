type SceneProps = {
  variant:
    | "booking"
    | "classes"
    | "video"
    | "calendar"
    | "reminder"
    | "payment"
    | "resources"
    | "locations"
    | "ai";
};

export function HeroDashboard() {
  return (
    <div className="hero-art mx-auto mt-10 max-w-5xl">
      <div className="metric-card -left-3 top-9 rotate-[-8deg]">
        <strong>$15/300</strong>
        <span>Revenue</span>
      </div>
      <div className="person-card left-4 bottom-2 bg-pink-100">
        <span className="avatar woman" />
      </div>
      <div className="dashboard-shell">
        <aside className="dashboard-nav">
          {["Calendar", "Customers", "Payments", "Reports", "Apps"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </aside>
        <main className="dashboard-main">
          <div className="dashboard-toolbar">
            <span>Calendar</span>
            <button type="button">Add booking</button>
          </div>
          <div className="calendar-grid">
            <div className="event green">Hair Styling 10:30</div>
            <div className="event yellow">Consultation 11:00</div>
            <div className="event blue">Yoga Class 2:00</div>
            <div className="summary-panel">
              <strong>28</strong>
              <span>Bookings</span>
              <i />
            </div>
          </div>
        </main>
      </div>
      <div className="person-card right-3 top-12 bg-blue-100">
        <span className="avatar man" />
      </div>
      <div className="metric-card right-24 top-3 rotate-[4deg]">
        <strong>Booking Confirmed</strong>
        <span>Room A</span>
      </div>
    </div>
  );
}

export function FeatureScene({ variant }: SceneProps) {
  const sceneMap = {
    booking: <BookingScene />,
    classes: <ClassesScene />,
    video: <VideoScene />,
    calendar: <CalendarScene />,
    reminder: <ReminderScene />,
    payment: <PaymentScene />,
    resources: <ResourcesScene />,
    locations: <LocationsScene />,
    ai: <AiScene />
  };

  return <div className="feature-scene">{sceneMap[variant]}</div>;
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      {children}
    </div>
  );
}

function BookingScene() {
  return (
    <div className="scene-network">
      <Phone>
        <div className="mini-banner" />
        <div className="mini-lines" />
        <button type="button" className="mini-button">Book</button>
      </Phone>
      <span className="qr-box" />
      <span className="bubble-avatar a1" />
      <span className="bubble-avatar a2" />
      <span className="bubble-avatar a3" />
    </div>
  );
}

function ClassesScene() {
  return (
    <div className="class-collage">
      <span className="photo photo-one" />
      <div className="class-card">Yoga<br />Classes</div>
      <div className="class-orb">Manage<br />Classes</div>
      <div className="attendance">
        <span>Attendee 1</span>
        <span>Attendee 2</span>
        <span>Attendee 3</span>
      </div>
      <span className="photo photo-two" />
    </div>
  );
}

function VideoScene() {
  return (
    <div className="video-stack">
      <span className="video-card person-one" />
      <span className="video-card person-two" />
      <span className="video-card person-three" />
      <span className="app-dot dot-one">Z</span>
      <span className="app-dot dot-two">M</span>
      <span className="app-dot dot-three">T</span>
    </div>
  );
}

function CalendarScene() {
  return (
    <div className="calendar-scene">
      <div className="mini-calendar">
        <span />
        <span className="slot green" />
        <span className="slot yellow" />
        <span className="slot blue" />
      </div>
      <span className="calendar-app app-a">G</span>
      <span className="calendar-app app-b">O</span>
      <span className="calendar-app app-c">M</span>
      <span className="dashed-path" />
    </div>
  );
}

function ReminderScene() {
  return (
    <div className="reminder-scene">
      <Phone>
        <div className="notification-card">
          <strong>10:00 AM</strong>
          <span>Reminder</span>
        </div>
      </Phone>
      <span className="portrait-shape" />
    </div>
  );
}

function PaymentScene() {
  return (
    <div className="payment-scene">
      <Phone>
        <span className="portrait-half" />
      </Phone>
      <span className="invoice-card">Invoice #0001</span>
      <span className="pay-dot">P</span>
      <span className="pay-dot second">$</span>
      <span className="pay-dot third">S</span>
    </div>
  );
}

function ResourcesScene() {
  return (
    <div className="resource-scene">
      <span className="resource-circle large" />
      <span className="resource-circle camera" />
      <span className="resource-circle small" />
      <span className="label-chip one">Booking Confirmed</span>
      <span className="label-chip two">Manage Resources</span>
    </div>
  );
}

function LocationsScene() {
  return (
    <div className="location-scene">
      <div className="map-blob">
        {[0, 1, 2, 3, 4].map((pin) => (
          <span key={pin} className={`pin pin-${pin}`} />
        ))}
      </div>
      <Phone>
        <div className="map-lines" />
      </Phone>
    </div>
  );
}

function AiScene() {
  return (
    <div className="ai-scene">
      <div className="glow" />
      <Phone>
        <div className="ai-icon">AI</div>
        <strong>AI Receptionist</strong>
        <span>Listening...</span>
        <div className="call-actions">
          <i />
          <i />
          <i className="end" />
        </div>
      </Phone>
    </div>
  );
}
