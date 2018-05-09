import * as React from 'react';
import { Navigation } from 'react-native-navigation';
import * as layoutGenerator from './layoutConverter';
import * as optionsConverter from './optionsConverter';
import { wrapReduxComponent } from './utils';
import ScreenVisibilityListener from './ScreenVisibilityListener';

const appLaunched = false;
const originalRegisterComponent = Navigation.registerComponent.bind(Navigation);

Navigation.startTabBasedApp = ({ tabs, tabsStyle, appStyle, drawer }) => {
  const onAppLaunched = () => {
    appLaunched = true;
    Navigation.setDefaultOptions(optionsConverter.convertDefaultOptions(tabsStyle, appStyle));
    Navigation.setRoot(layoutGenerator.convertBottomTabs(tabs, drawer));
  }

  appLaunched ? onAppLaunched() : Navigation.events().registerAppLaunchedListener(onAppLaunched);
};

Navigation.startSingleScreenApp = ({ screen, tabsStyle, appStyle, drawer, components }) => {
  const onAppLaunched = () => {
    appLaunched = true;
    Navigation.setDefaultOptions(optionsConverter.convertDefaultOptions(tabsStyle, appStyle));
    Navigation.setRoot(layoutGenerator.convertSingleScreen(screen, drawer, components));
  }

  appLaunched ? onAppLaunched() : Navigation.events().registerAppLaunchedListener(onAppLaunched);
};


Navigation.registerComponent = (name, generator, store, provider) => {
  const Component = store ? wrapReduxComponent(generator, store, provider) : generator();

  const Wrapped = class extends React.Component {
    static get options() {
      const navigatorStyle = Component.navigatorStyle;
      const navigatorButtons = Component.navigatorButtons;
      if (navigatorStyle || navigatorButtons) {
        return optionsConverter.convertStyle(navigatorStyle, navigatorButtons);
      } else {
        return undefined;
      }
    }

    componentWillUnmount() {
      this.originalRef = undefined;
    }

    componentDidAppear() {
      if (this.originalRef.props) {
        this.originalRef.props.navigator.isVisible = true;
      }
      if (this.originalRef.onNavigatorEvent) {
        this.originalRef.onNavigatorEvent({ id: 'willAppear' });
        this.originalRef.onNavigatorEvent({ id: 'didAppear' });
      }
    }

    componentDidDisappear() {
      if (this.originalRef.props) {
        this.originalRef.props.navigator.isVisible = false;
      }
      if (this.originalRef.onNavigatorEvent) {
        this.originalRef.onNavigatorEvent({ id: 'willDisappear' });
        this.originalRef.onNavigatorEvent({ id: 'didDisappear' });
      }
    }

    onNavigationButtonPressed(id) {
      if (this.originalRef.onNavigatorEvent) {
        this.originalRef.onNavigatorEvent({ id });
      }
    }

    render() {
      return (
        <Component ref={(r) => this.originalRef = r} />
      );
    }
  }

  originalRegisterComponent(name, () => Wrapped);
};


module.exports = {
  Navigation,
  ScreenVisibilityListener
};
