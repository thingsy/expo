'use strict';
import { GoogleSignIn } from 'expo-google-sign-in';
import { Localization } from 'expo-localization';
import { Platform } from 'expo-core';
import { Image } from 'react-native';
export const name = 'GoogleSignIn';
/*
 If you define the name of your email address, this will automatically sign you in (after the first successful sign-in) ex: bacon@expo.io
*/
const accountName = 'bacon@expo.io'; // undefined;

const config = {
  language: Localization.locale,
  /*
    [iOS]: Only this clientId works in the Expo Client. 
  */
  clientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
};

const longerTimeout = 10000;
export async function test({
  describe,
  xdescribe,
  xit,
  it,
  beforeEach,
  afterEach,
  jasmine,
  expect,
}) {
  describe('GoogleSignIn', async () => {
    let originalTimeout;

    beforeEach(() => {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = longerTimeout;
    });

    afterEach(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    beforeEach(async () => {
      await GoogleSignIn.initAsync(config);
    });

    it('has constants', () => {
      function validateConstants(constants) {
        expect(constants).toBeDefined();
        Object.values(constants).map(constant => {
          expect(typeof constant).toBe('string');
        });
      }

      validateConstants(GoogleSignIn.ERRORS);
      validateConstants(GoogleSignIn.SCOPES);
      validateConstants(GoogleSignIn.TYPES);
    });

    xit(`GoogleSignIn.initAsync() initializes Google Sign-In`, async () => {
      await GoogleSignIn.initAsync(config);
    });

    async function signInWithResult(expectedResult) {
      const { type, user } = await GoogleSignIn.signInAsync();

      expect(type).toBeDefined();
      expect(typeof type).toBe('string');
      expect(user).toBeDefined();
      if (type === 'cancel') {
        expect(user).toBe(null);
      } else if (type === 'success') {
        expect(user instanceof GoogleSignIn.User).toBe(true);
      }

      if (expectedResult) {
        expect(type).toBe(expectedResult);
      }
    }

    /*
      If you cancel, this will just try again.
    */
    async function ensureAuthenticationAsync() {
      // const isSignedIn = await GoogleSignIn.isSignedInAsync();
      const user = await GoogleSignIn.signInSilentlyAsync();
      if (user instanceof GoogleSignIn.User) {
        return user;
      }
      // Give the UI some time to animate.
      await GoogleSignIn.initAsync(config);
      await GoogleSignIn.signInAsync();
      return ensureAuthenticationAsync();
    }

    async function signInWithConfigAsync(customConfig) {
      await GoogleSignIn.initAsync({
        ...config,
        ...customConfig,
      });
      await GoogleSignIn.signOutAsync();
      await signInWithResult();
    }

    describe('GoogleSignIn.signInAsync()', () => {
      it(`Cancelled signing-in`, async () => {
        await GoogleSignIn.signOutAsync();
        await signInWithResult('cancel');
      });

      xit(`Successfully signed-in`, async () => {
        await GoogleSignIn.signOutAsync();
        await signInWithResult('success');
      });

      /*
       * Cannot test
       * Expect: You should see the modal popup, then go back down. You will then be signed in
       * This only works if you have already successfully signed-in with the same account, on the same device before.
       *
       * > If the user has "disconnected" ("revoked" on android) the account, this will show only the defined account.
       */
      it(`Reauthenticate account`, async () => {
        await ensureAuthenticationAsync();
        const accountName = GoogleSignIn.currentUser.email;
        await signInWithConfigAsync({ accountName });
      });

      it(`Reauthenticate account that has been disconnected ${accountName}`, async () => {
        await ensureAuthenticationAsync();
        await GoogleSignIn.disconnectAsync();
        await GoogleSignIn.signOutAsync();
        await signInWithConfigAsync({ accountName });
      });

      /*
       * Cannot test
       * Expect: You should see no change from the default sign-in.
       * 
       * > Maybe one day Google with throw an error if an account doesn't exist, we would want to test that.
       */
      it(`Attempt to sign-in with an account that doesn't exist.`, async () => {
        await signInWithConfigAsync({ accountName: 'evanjbacon@gmail' });
      });

      if (Platform.OS === 'ios') {
        /*
        * Cannot test
        * Expect: You should see the language be french. If your default language is french, then change the language prop to something else. ex: en-US
        */
        it(`Sign-in with a different language.`, async () => {
          await signInWithConfigAsync({ language: 'fr' });
        });
      }
    });

    describe('GoogleSignIn user', () => {
      it('GoogleSignIn.currentUser & getCurrentUserAsync() returns a user when signed-in, and null when signed-out', async () => {
        await GoogleSignIn.signOutAsync();
        expect(GoogleSignIn.currentUser).toBeDefined();
        expect(GoogleSignIn.currentUser).toBe(null);

        const invalidUser = await GoogleSignIn.getCurrentUserAsync();
        expect(invalidUser).toBeDefined();
        expect(invalidUser).toBe(null);

        await ensureAuthenticationAsync();

        expect(GoogleSignIn.currentUser).toBeDefined();
        expect(GoogleSignIn.currentUser instanceof GoogleSignIn.User).toBe(true);

        const validUser = await GoogleSignIn.getCurrentUserAsync();
        expect(validUser).toBeDefined();
        expect(validUser instanceof GoogleSignIn.User).toBe(true);
      });

      xit('GoogleSignIn.getCurrentUserAsync() returns a user when signed-in, and null when signed-out', async () => {
        await GoogleSignIn.signOutAsync();
        const invalidUser = await GoogleSignIn.getCurrentUserAsync();
        expect(invalidUser).toBeDefined();
        expect(invalidUser).toBe(null);
        await ensureAuthenticationAsync();
        const validUser = await GoogleSignIn.getCurrentUserAsync();
        expect(validUser).toBeDefined();
        expect(validUser instanceof GoogleSignIn.User).toBe(true);
      });
    });

    describe('GoogleSignIn.signInSilentlyAsync()', () => {
      it('gets user when signed-in, gets nothing when signed-out', async () => {
        await GoogleSignIn.signOutAsync();
        user = await GoogleSignIn.signInSilentlyAsync();
        expect(user).toBe(null);
        await ensureAuthenticationAsync();
        let user = await GoogleSignIn.signInSilentlyAsync();
        expect(user instanceof GoogleSignIn.User).toBe(true);
      });
    });

    describe('GoogleSignIn.getPhotoAsync()', () => {
      async function imageSizeAsync(uri: string): Promise<Size> {
        return await new Promise((res, rej) =>
          Image.getSize(uri, (width, height) => res({ width, height }), rej)
        );
      }
      it('returns string', async () => {
        await ensureAuthenticationAsync();
        const uri = await GoogleSignIn.getPhotoAsync();
        expect(uri).toBeDefined();
        // If this fails, it is probably because your Gmail account doesn't have a image.
        expect(typeof uri).toBe('string');
        expect(uri.length > 1).toBe(true);
      });
      it('default image size is `128`', async () => {
        await ensureAuthenticationAsync();
        const uri = await GoogleSignIn.getPhotoAsync();
        const { width, height } = await imageSizeAsync(uri);
        const longest = Math.max(width, height);
        expect(longest).toBe(128);
      });

      /*
       * This function can sometimes be wrong if you go too far away from 128. 
       * Google will also not return an image passed the max original image size.
       */
      const customImageSize = 64;
      it(`custom image size is \`${customImageSize}\``, async () => {
        await ensureAuthenticationAsync();
        const uri = await GoogleSignIn.getPhotoAsync(customImageSize);
        const { width, height } = await imageSizeAsync(uri);
        const longest = Math.max(width, height);
        expect(longest).toBe(customImageSize);
      });
    });

    describe('GoogleSignIn.signOutAsync()', async () => {
      it('signs-out', async () => {
        await ensureAuthenticationAsync();
        let isSignedIn = await GoogleSignIn.isSignedInAsync();
        expect(isSignedIn).toBe(true);

        await GoogleSignIn.signOutAsync();
        isSignedIn = await GoogleSignIn.isSignedInAsync();
        expect(isSignedIn).toBe(false);
      });

      it('disconnects', async () => {
        await ensureAuthenticationAsync();
        let isConnected = await GoogleSignIn.isConnectedAsync();
        expect(isConnected).toBe(true);

        await GoogleSignIn.signOutAsync();
        isConnected = await GoogleSignIn.isConnectedAsync();
        expect(isConnected).toBe(false);
      });
    });

    describe('GoogleSignIn.disconnectAsync()', async () => {
      it('disconnects', async () => {
        await ensureAuthenticationAsync();
        let isConnected = await GoogleSignIn.isConnectedAsync();
        expect(isConnected).toBe(true);

        await GoogleSignIn.disconnectAsync();
        isConnected = await GoogleSignIn.isConnectedAsync();
        expect(isConnected).toBe(false);
      });

      it('signs-out', async () => {
        await ensureAuthenticationAsync();
        let isSignedIn = await GoogleSignIn.isSignedInAsync();
        expect(isSignedIn).toBe(true);

        await GoogleSignIn.disconnectAsync();
        isSignedIn = await GoogleSignIn.isSignedInAsync();
        expect(isSignedIn).toBe(false);
      });
    });

    xit(`GoogleSignIn.currentUser.refreshAuth()`, async () => {
      await ensureAuthenticationAsync();

      const { auth } = GoogleSignIn.currentUser;
      console.log({ auth });
      const nextAuth = await GoogleSignIn.currentUser.refreshAuth();
      console.log({ nextAuth });
    });

    xit(`GoogleSignIn.currentUser.clearCache()`, async () => {
      await ensureAuthenticationAsync();
      const nextAuth = await GoogleSignIn.currentUser.clearCache();
      console.log({ nextAuth });
    });
  });
}