# Build image layer
FROM golang:1.21.5 AS builder
ARG VERSION
ADD . /app
WORKDIR /app
RUN go mod download
ENV CGO_ENABLED=0 GO111MODULE=on GOOS=linux
RUN go build -a -ldflags "-s -w -X 'github.com/marcopollivier/techagenda/lib/config.version=$VERSION'" -o techagenda .

# Download frontend deps
FROM node:16-alpine as frontend
ADD ./ui /ui
WORKDIR /ui
RUN npm install

# Release image layer
FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/techagenda ./techagenda
COPY --from=builder /app/public ./public
COPY --from=frontend /ui ./ui
CMD ./techagenda

