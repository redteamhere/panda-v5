FROM node:18-bookworm

# Install Java, Python, build essentials, wget, unzip, curl, zipalign
RUN apt-get update && apt-get install -y \
    default-jdk \
    python3 \
    python3-pip \
    wget \
    curl \
    unzip \
    git \
    zipalign \
    && rm -rf /var/lib/apt/lists/*

# Setup Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0"

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdtools.zip && \
    unzip -q /tmp/cmdtools.zip -d /tmp/cmdtools && \
    mkdir -p ${ANDROID_HOME}/cmdline-tools/latest && \
    mv /tmp/cmdtools/cmdline-tools/* ${ANDROID_HOME}/cmdline-tools/latest/ && \
    rm -rf /tmp/cmdtools.zip /tmp/cmdtools

# Accept licenses and install platform-tools, build-tools 35.0.0
RUN yes | sdkmanager --licenses || true
RUN sdkmanager "platform-tools" "build-tools;35.0.0" "platforms;android-35"

WORKDIR /opt/fisher-node

COPY package.json ./
RUN npm install --production && npm rebuild better-sqlite3

COPY . ./

EXPOSE 8080

CMD ["node", "server_remote.js"]
