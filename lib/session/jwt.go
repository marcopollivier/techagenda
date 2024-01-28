package session

import (
	"crypto/ed25519"
	"encoding/json"
	"errors"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/marcopollivier/techagenda/lib/config"
	"github.com/markbates/goth"
)

type UserSession struct {
	ID       uint      `json:"id"`
	Provider string    `json:"provider"`
	Token    string    `json:"token"`
	AuthUser goth.User `json:"auth_user"`
}

func GenerateJWT(userID uint, auth goth.User) (tokenString string, err error) {
	var (
		pk     = ed25519.PrivateKey(config.Get().JWT.Private)
		token  = jwt.New(jwt.SigningMethodEdDSA)
		claims = token.Claims.(jwt.MapClaims)
		sess   UserSession
	)

	sess = UserSession{
		ID:       userID,
		Provider: auth.Provider,
		Token:    auth.AccessToken,
		AuthUser: auth,
	}
	claims["exp"] = float64(time.Now().Add(24 * time.Hour).UnixMilli())
	claims["authorized"] = true
	claims["session"] = sess

	if tokenString, err = token.SignedString(pk); err != nil {
		return "", err
	}

	return tokenString, nil
}

func UnmarshalSession(tokenString string) (sess UserSession, err error) {
	var (
		token  *jwt.Token
		claims jwt.MapClaims
		ok     bool
		bytes  []byte
	)
	if token, err = jwt.Parse(tokenString, jwtParser); err != nil {
		return sess, err
	}
	if !token.Valid {
		return sess, errors.New("invalid token session")
	}
	if claims, ok = token.Claims.(jwt.MapClaims); !ok {
		return sess, errors.New("unable to extract claims")
	}
	if bytes, err = json.Marshal(claims["session"]); err != nil {
		return sess, errors.New("unable to extract session")
	}
	if err = json.Unmarshal(bytes, &sess); err != nil {
		return sess, errors.New("unable to parse session")
	}
	return sess, nil

}

func jwtParser(token *jwt.Token) (any, error) {
	key := ed25519.PublicKey(config.Get().JWT.Public)
	_, ok := token.Method.(*jwt.SigningMethodEd25519)
	if !ok {
		return "", errors.New("fail to open session token")
	}
	return key, nil
}
