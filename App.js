/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { List, Drawer, InputItem, Picker, Provider, Button, Flex, Grid, WingBlank, Modal, WhiteSpace } from '@ant-design/react-native';
import { Text, ART, ScrollView, Dimensions, View, StatusBar, Image, StyleSheet, TouchableNativeFeedback, BackHandler, ToastAndroid } from 'react-native';
import { IconOutline } from "@ant-design/icons-react-native";
import TcpSocket from 'react-native-tcp-socket';
import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-community/async-storage';


import arrorImage from './Images/arror.png'

const { Surface, Shape, Path,Pattern, } = ART;

function str2utf8(str) {
  return eval('\'' + encodeURI(str).replace(/%/gm, '\\x') + '\'');
}

const storage = new Storage({
  // 最大容量，默认值1000条数据循环存储
  size: 1000,

  // 存储引擎：对于RN使用AsyncStorage，对于web使用window.localStorage
  // 如果不指定则数据只会保存在内存中，重启后即丢失
  storageBackend: AsyncStorage,

  // 数据过期时间，默认一整天（1000 * 3600 * 24 毫秒），设为null则永不过期
  defaultExpires: null,

  // 读写时在内存中缓存数据。默认启用。
  enableCache: true, // 你可以在构造函数这里就写好sync的方法 // 或是在任何时候，直接对storage.sync进行赋值修改 // 或是写到另一个文件里，这里require引入

  // 如果storage中没有相应数据，或数据已过期，
  // 则会调用相应的sync方法，无缝返回最新数据。
  // sync方法的具体说明会在后文提到
  //sync: require('你可以另外写一个文件专门处理sync'),
});

var client;

var test = {};
var line = {};

function testAddOrModify(key, value) {
  test[key] = value;
}

function testDelete(key) {
  delete test[key];
}

function lineAdd(key, value) {
  if (line[key]) {
    line[key] = line[key] + "," + value;
  } else {
    line[key] = value;
  }

}

function lindModify(key, value) {
  line[key] = value;
}

function lineDelete(key) {
  delete line[key];
}

function lineConsole(key) {
  var strs = new Array();
  strs = line[key].split(",");
  for (var i = 0; i < strs.length; i++) {
    console.log(test[strs[i]] + "++"); //分割后的字符输出
  }
}

const speeds = [
  [
    {
      label: '低速',
      value: 'Low',
    },
    {
      label: '中速',
      value: 'Mid',
    },
    {
      label: '高速',
      value: 'High',
    },
  ],
];

function buildMap() {
  ToastAndroid.show('开始建图', ToastAndroid.SHORT);
}

function buttomToast() {
  ToastAndroid.show('任务按钮', ToastAndroid.SHORT);
}

var firstClick = 0;
export default class App extends Component {
  constructor(props) {
    super(props);

    this.onConnectClose = () => {
      this.setState({
        connectvisible: false,
      });
    }

    this.onClose1 = () => {
      this.setState({
        visible1: false,
      });
    };

    this.onClose2 = () => {
      this.setState({
        visible2: false,
      });
    };

    this.menuSelect = (index) => {
      this.setState({
        mapselectindex: index,
      });
      setTimeout(() => {
        this.drawer.closeDrawer();
      }, 200);

    }

    this.AddMenu = (v) => {
      if (v !== '') {
        var tempData = this.state.mapsname;
        tempData.push(v);
        this.setState({
          mapsname: tempData
        })
      }
    }

    this.deleteMunu = (index) => {
      var tempData = this.state.mapsname;
      tempData.splice(index, 1);
      this.setState({
        mapsname: tempData,
        mapselectindex: 0
      })
    }

    this.modifyMenu = (index, name) => {
      var tempData = this.state.mapsname;
      tempData.splice(index, 1, name);
      this.setState({
        mapsname: tempData
      })
    }

    this.onButtonClick2 = (index, value) => {
      Modal.operation([
        { text: '编辑地图名称', onPress: () => this.onButtonClick3(index, value) },
        { text: '删除地图', onPress: () => this.deleteMunu(index) },
      ]);
    };

    this.onButtonClick3 = (index, value) => {
      Modal.prompt(
        '地图名称',
        '请输入更改地图名称',
        [{
          text: '取消',
          //onPress: () => console.log('cancel'),
          style: 'cancel',
        },
        { text: '确定', onPress: (v) => this.modifyMenu(index, v) }],
        'default',
        value,
        ['请输入更改地图名称'],
      );
    };

    this.onButtonClick5 = () => {
      Modal.prompt(
        '地图名称',
        '请输入新增地图名称',
        [{
          text: '取消',
          //onPress: () => console.log('cancel'),
          style: 'cancel',
        },
        { text: '确定', onPress: (v) => this.AddMenu(v) }],
        'default',
        null,
        ['请输入新增地图名称'],
      );
    };

    this.onOpenChange = isOpen => {
      /* tslint:disable: no-console */
      //console.log('是否打开了 Drawer', isOpen.toString());
    };

    this.state = {
      connectvisible: true,
      visible1: false,
      visible2: false,
      forward: false,
      back: false,
      left: false,
      right: false,
      speedValue: ['Low'],
      name: 'ABB-001',
      socketString: '192.168.11.102:11111',
      rundistance: -1,
      power: -1,
      runtime: 0,
      mapsname: ['默认地图', 'F18-3F', 'G10-1.5F', 'E104F'],
      mapselectindex: 0
    };

    this.handleBack = this.handleBack.bind(this);
  }
  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBack);
    //Toast.loading("ABB连接中...", 0); 
    this.socketStart();
    this.GetFromStorage();
    this.timer = setInterval(() => {
      this.setState({ runtime: this.state.runtime + 1 })
    }, 60000)

  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    client.destroy();
    this.SaveToStorage();
    clearInterval(this.timer);
  }

  handleBack = () => {
    var timestamp = (new Date()).valueOf();
    if (timestamp - firstClick > 2000) {
      firstClick = timestamp;
      ToastAndroid.show('再按一次退出', ToastAndroid.SHORT);
      this.SaveToStorage();
      return true;
    } else {
      return false;
    }
  }

  GetFromStorage = () => {
    // 读取
    storage
      .load({
        key: 'userdatas',

        // autoSync(默认为true)意味着在没有找到数据或数据过期时自动调用相应的sync方法
        autoSync: true, // 设置为false的话，则等待sync方法提供的最新数据(当然会需要更多时间)。

        // syncInBackground(默认为true)意味着如果数据过期，
        // 在调用sync方法的同时先返回已经过期的数据。
        syncInBackground: true,
        // 你还可以给sync方法传递额外的参数
        syncParams: {
          extraFetchOptions: {
            // 各种参数
          },
          someFlag: true,
        },
      })
      .then(ret => {
        // 如果找到数据，则在then方法中返回
        // 注意：这是异步返回的结果（不了解异步请自行搜索学习）
        // 你只能在then这个方法内继续处理ret数据
        // 而不能在then以外处理
        // 也没有办法“变成”同步返回
        // 你也可以使用“看似”同步的async/await语法

        //console.log(ret);
        this.setState({
          speedValue: ret.speedValue,
          name: ret.name,
          socketString: ret.socketString,
        });
      })
      .catch(err => {
        //如果没有找到数据且没有sync方法，
        //或者有其他异常，则在catch中返回
        //console.warn(err.message);
        switch (err.name) {
          case 'NotFoundError':
            // TODO;
            break;
          case 'ExpiredError':
            // TODO
            break;
        }
      });
  }

  SaveToStorage = () => {
    // 使用key来保存数据（key-only）。这些数据一般是全局独有的，需要谨慎单独处理的数据
    // 批量数据请使用key和id来保存(key-id)，具体请往后看
    // 除非你手动移除，这些数据会被永久保存，而且默认不会过期。
    storage.save({
      key: 'userdatas', // 注意:请不要在key中使用_下划线符号!
      data: {
        speedValue: this.state.speedValue,
        name: this.state.name,
        socketString: this.state.socketString,
      },

      // 如果不指定过期时间，则会使用defaultExpires参数
      // 如果设为null，则永不过期
      expires: null,
    });
  }

  testPointAndLine = () => {
    testAddOrModify('3', 'Point(3,3,3)');
    testAddOrModify('1', 'Point(1,1,1)');
    testAddOrModify('2', 'Point(2,2,2)');
    testAddOrModify('3', 'Point(5,5,5)');

    lineAdd('计划路线', '1')
    lineAdd('计划路线', '2')
    lineAdd('计划路线', '1')
    lineAdd('计划路线', '3')

    lineAdd('计划路线2', '3')
    lineAdd('计划路线2', '2')
    lineAdd('计划路线2', '3')
    lineAdd('计划路线2', '2')

    //lineConsole('计划路线')
    //lineConsole('计划路线2')

    //console.log(test);
    //console.log(line);
  }

  socketStart = () => {
    var options = {
      host: this.state.socketString.substring(0, this.state.socketString.indexOf(":")),
      port: this.state.socketString.substring(this.state.socketString.indexOf(":") + 1),
    }
    //console.log(options);
    // Create socket
    client = TcpSocket.createConnection(options);

    client.on('data', (data) => {
      data2 = str2utf8(data);
      this.setState({
        connectvisible: false,
      })
      //var tempString = "ABB#ReturnBattery#88*";
      if (data2.indexOf('ReturnBattery') > -1) {
        var tempPower = data2.substring(data2.lastIndexOf('#') + 1, data2.lastIndexOf('*'));
        //console.log(tempPower + "%");
        this.setState({
          power: tempPower
        })
      }
      console.log(str2utf8(data2));
    });

    client.on('error', (error) => {
      this.setState({
        connectvisible: true,
      })
      console.log(error);
    })

    client.on('close', () => {
      this.setState({
        connectvisible: true,
      })
      console.log('Connection closed!');
    });

  }

  ForwardIn = () => {
    this.setState({
      forward: true,
    });
    client.write("ABB#SetControlMode#Forward*");
    //console.log('Forward In');
    this.Forward();
  }

  Forward = () => {
    if (this.state.forward) {
      client.write("ABB#SetControlMode#Forward*");
      //console.log('Forward running');
      setTimeout(() => {
        this.Forward();
      }, 100);
    }
  }

  ForwardOut = () => {
    this.setState({
      forward: false,
    });
    //console.log('Forward Out');
  }

  LeftIn = () => {
    this.setState({
      left: true,
    });
    client.write("ABB#SetControlMode#Left*");
    //console.log('Left In');
    this.Left();
  }

  Left = () => {
    if (this.state.left) {
      client.write("ABB#SetControlMode#Left*");
      //console.log('Left running');
      setTimeout(() => {
        this.Left();
      }, 100);
    }
  }

  LeftOut = () => {
    this.setState({
      left: false,
    });
    //console.log('Left Out');
  }

  RightIn = () => {
    this.setState({
      right: true,
    });
    client.write("ABB#SetControlMode#Right*");
    //console.log('Right In');
    this.Right();
  }

  Right = () => {
    if (this.state.right) {
      client.write("ABB#SetControlMode#Right*");
      //console.log('Right running');
      setTimeout(() => {
        this.Right();
      }, 100);
    }
  }

  RightOut = () => {
    this.setState({
      right: false,
    });
    //console.log('Right Out');
  }

  BackIn = () => {
    this.setState({
      back: true,
    });
    client.write("ABB#SetControlMode#Back*");
    console.log('Back In');
    this.Back();
  }

  Back = () => {
    if (this.state.back) {
      client.write("ABB#SetControlMode#Back*");
      //console.log('Back running');
      setTimeout(() => {
        this.Back();
      }, 100);
    }
  }

  BackOut = () => {
    this.setState({
      back: false,
    });
    //console.log('Back Out');
  }

  Charge = () => {
    ToastAndroid.show('开始自动回充', ToastAndroid.SHORT);
    client.write("ABB#ReturnCharging*");
  }

  Safe = () => {
    ToastAndroid.show('暂不支持消毒功能', ToastAndroid.SHORT);
  }

  Close = () => {
    ToastAndroid.show('暂不支持关闭功能', ToastAndroid.SHORT);
  }

  Sound = () => {
    ToastAndroid.show('暂不支持音量功能', ToastAndroid.SHORT);
  }

  Speed = (v) => {
    this.setState({
      speedValue: v
    })
    client.write("ABB#SetSpeedMode#" + v[0] + "*");
    //console.log("ABB#SetSpeedMode#" + v[0] + "*");
  }

  IP = (v) => {
    this.setState({
      socketString: v
    })
    //console.log(v);
  }

  Name = (v) => {
    this.setState({
      name: v
    })
    //console.log(v);
  }

  render() {
    const path = ART.Path();
    if (this.state.mapselectindex === 0) {
      path.moveTo(1, 1); //将起始点移动到(1,1) 默认(0,0)
      path.lineTo(300, 300); //连线到目标点(300,1)
    }
    else if (this.state.mapselectindex === 1) {
      path.moveTo(1, 1); //将起始点移动到(1,1) 默认(0,0)
      path.lineTo(300, 300); //连线到目标点(300,1)
      path.lineTo(1, 300); //连线到目标点(300,1)
      path.lineTo(300, 1); //连线到目标点(300,1)
      path.close();
    } else {
      path.moveTo(150, 1)
        .arc(0, 149, 25)
        .arc(0, -99, 25)
        .close();
    }

    const pattern = new Pattern(Image.resolveAssetSource(require('./Images/arror.png')),100,100,100,100)

    const itemArr = this.state.mapsname
      .map((value, index) => {
        if (index === this.state.mapselectindex) {
          return (
            <View key={index} >
              <WhiteSpace size="lg" />
              <WingBlank>
                <Button onLongPress={() => this.onButtonClick2(index, value)} type="primary"
                  style={{ backgroundColor: "#684ecd", borderColor: "#684ecd" }}
                  activeStyle={{ backgroundColor: '#877abb' }}>
                  {value}
                </Button>
              </WingBlank>
            </View>
          );
        }
        return (
          <View key={index}>
            <WhiteSpace size="lg" />
            <WingBlank>
              <Button onPress={() => this.menuSelect(index)}
                onLongPress={() => this.onButtonClick2(index, value)}>
                {value}
              </Button>
            </WingBlank>
          </View>
        );
      });
    const sidebar = (
      <View style={{ height: "100%" }}>
        <Flex style={{ backgroundColor: "#684ecd", height: 50 }}>
          <Flex.Item></Flex.Item>
          <Flex.Item >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "bold", fontSize: 18 }}>地图选择</Text>
          </Flex.Item>
          <Flex.Item ></Flex.Item>
        </Flex>

        <ScrollView >
          <View style={{ height: "100%" }}>

            {itemArr}
            <WhiteSpace size="lg" />
            <WingBlank>
              <Button onPress={this.onButtonClick5}>
                新增地图
              </Button>
            </WingBlank>
          </View>
          <WhiteSpace size="lg" />
        </ScrollView>
      </View>
    );
    const data = [
      {
        icon: <TouchableNativeFeedback onPress={buttomToast}>
          <Image source={require('./Images/task2.png')} style={{ width: "50%", height: "50%" }} />
        </TouchableNativeFeedback>,
        text: <Text style={{ color: "#684ecd", fontWeight: "bold", fontSize: 12 }}>任务</Text>
      },
      {
        icon: <TouchableNativeFeedback onPress={() => this.setState({ visible2: true })}>
          <Image source={require('./Images/auto.png')} style={{ width: "50%", height: "50%" }} />
        </TouchableNativeFeedback>,
        text: <Text style={{ color: "#684ecd", fontWeight: "bold", fontSize: 12 }}>自动</Text>
      },
      {
        icon: <TouchableNativeFeedback onPress={this.Charge}>
          <Image source={require('./Images/charge.png')} style={{ width: "50%", height: "50%" }} />
        </TouchableNativeFeedback>,
        text: <Text style={{ color: "#684ecd", fontWeight: "bold", fontSize: 12 }}>充电</Text>
      },
      {
        icon: <TouchableNativeFeedback onPress={this.Safe}>
          <Image source={require('./Images/safe2.png')} style={{ width: "50%", height: "50%" }} />
        </TouchableNativeFeedback>,
        text: <Text style={{ color: "#684ecd", fontWeight: "bold", fontSize: 12 }}>消毒</Text>
      }
    ]
    return (

      <View style={{ backgroundColor: "#684ecd", height: "100%" }}>
        <Provider>
          <StatusBar backgroundColor="#684ecd" barStyle="light-content" />
          <Drawer
            sidebar={sidebar}
            position="left"
            open={false}
            drawerRef={el => (this.drawer = el)}
            onOpenChange={this.onOpenChange}
            drawerBackgroundColor="#ccc"
            drawerWidth={250}
          >
            <WingBlank style={{ marginBottom: 5 }}>
              <Flex>
                <Flex.Item>
                  <IconOutline onPress={() => this.drawer && this.drawer.openDrawer()} name="menu" style={{ position: "absolute", left: 4, color: "#ffffff", fontSize: 28 }} />
                </Flex.Item>
                <Flex.Item style={{ paddingTop: 5 }}>
                  <Text style={{ color: "white", textAlign: "center", fontWeight: "bold", fontSize: 18 }}>ABB({this.state.connectvisible ? "未连接" : "已连接"})</Text>
                </Flex.Item>
                <Flex.Item>
                  <IconOutline onPress={() => this.setState({ visible1: true })} name="setting" style={{ position: "absolute", right: 4, color: "#ffffff", fontSize: 28 }} />
                </Flex.Item>
              </Flex>
            </WingBlank>

            <Modal
              title="ABB连接失败"
              transparent
              onClose={this.onConnectClose}
              visible={this.state.connectvisible}
              maskClosable
            >
              <View style={{ height: 130 }}>
                <Flex direction="column">
                  <Flex.Item style={{ backgroundColor: "red" }}>
                    <Image source={require('./Images/nowifi.png')} />
                  </Flex.Item>
                </Flex>

              </View>
              <Text style={{ textAlign: "center" }}>{this.state.socketString}</Text>
              <Button onPress={this.socketStart} type="primary" style={{ backgroundColor: "#684ecd", borderColor: "#684ecd" }} activeStyle={{ backgroundColor: '#877abb' }}>
                点击重连
          </Button>
            </Modal>

            <Modal
              transparent={false}
              visible={this.state.visible1}
              animationType="slide-up"
              onClose={this.onClose1}
            >

              <Flex style={{ backgroundColor: "#684ecd", height: 50 }}>
                <Flex.Item>
                  <IconOutline onPress={this.onClose1} name="left" style={{ position: "absolute", left: 18, top: -12, color: "#ffffff", fontSize: 28 }} />
                </Flex.Item>
                <Flex.Item >
                  <Text style={{ color: "white", textAlign: "center", fontWeight: "bold", fontSize: 18 }}>设置</Text>
                </Flex.Item>
                <Flex.Item >
                </Flex.Item>
              </Flex>

              <View style={{ height: "100%" }}>
                <WhiteSpace size="lg" />

                <List>
                  <InputItem
                    clear
                    value={this.state.name}
                    onChange={v => this.Name(v)}
                    placeholder="请输入ABB名称"
                  >
                    名称
          </InputItem>
                  <InputItem
                    clear
                    type="number"
                    value={this.state.socketString}
                    onChange={v => this.IP(v)}
                    placeholder="请输入IP"
                  >
                    IP
          </InputItem>

                  <Picker
                    data={speeds}
                    title="选择速度"
                    cascade={false}
                    extra="请选择"
                    value={this.state.speedValue}
                    onChange={v => this.Speed(v)}
                  >
                    <List.Item arrow="horizontal">速度</List.Item>
                  </Picker>

                  <InputItem
                    clear
                    value="更多帮助请查看说明文档"
                    onChange={value => {
                      this.setState({
                        value,
                      });
                    }}
                    placeholder="更多帮助请查看说明文档"
                    editable={false}
                  >
                    帮助
          </InputItem>
                </List>

              </View>

            </Modal>

            <Modal
              popup
              visible={this.state.visible2}
              animationType="slide-up"
              onClose={this.onClose2}
            >
              <View style={{ height: 200, padding: 15 }}>
                <Flex>
                  <Flex.Item>
                  </Flex.Item>
                  <Flex.Item >
                    <Button onPressIn={this.ForwardIn} onPressOut={this.ForwardOut} style={{ width: "100%", height: 60, backgroundColor: "#684ecd", borderColor: "#684ecd" }} activeStyle={{ backgroundColor: '#877abb' }} >
                      <IconOutline name="caret-up" style={{ color: "#ffffff", fontSize: 80 }} />
                    </Button>
                  </Flex.Item>
                  <Flex.Item >
                  </Flex.Item>
                </Flex>
                <Flex>
                  <Flex.Item>
                    <Button onPressIn={this.LeftIn} onPressOut={this.LeftOut} style={{ width: "100%", height: 60, backgroundColor: "#684ecd", borderColor: "#684ecd" }} activeStyle={{ backgroundColor: '#877abb' }} >
                      <IconOutline name="caret-left" style={{ color: "#ffffff", fontSize: 80 }} />
                    </Button>
                  </Flex.Item>
                  <Flex.Item style={{ padding: 5 }}>
                    <Button type="primary" onPress={this.onClose2} style={{ width: "100%", height: 60, backgroundColor: "#684ecd", borderColor: "#684ecd" }} activeStyle={{ backgroundColor: '#877abb' }}>
                      完成
                </Button>
                  </Flex.Item>
                  <Flex.Item >
                    <Button onPressIn={this.RightIn} onPressOut={this.RightOut} style={{ width: "100%", height: 60, backgroundColor: "#684ecd", borderColor: "#684ecd" }} activeStyle={{ backgroundColor: '#877abb' }} >
                      <IconOutline name="caret-right" style={{ color: "#ffffff", fontSize: 80 }} />
                    </Button>
                  </Flex.Item>
                </Flex>
                <Flex>
                  <Flex.Item>
                  </Flex.Item>
                  <Flex.Item >
                    <Button onPressIn={this.BackIn} onPressOut={this.BackOut} style={{ width: "100%", height: 60, backgroundColor: "#684ecd", borderColor: "#684ecd" }} activeStyle={{ backgroundColor: '#877abb' }} >
                      <IconOutline name="caret-down" style={{ color: "#ffffff", fontSize: 80 }} />
                    </Button>
                  </Flex.Item>
                  <Flex.Item >
                  </Flex.Item>
                </Flex>
              </View>
              <WhiteSpace size="lg" />
            </Modal>

            <WingBlank style={{ marginBottom: 5 }}>
              <Flex>
                <Flex.Item >
                </Flex.Item>
                <Flex.Item >
                  <Text style={{ color: "white", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>无任务</Text>
                </Flex.Item>
                <Flex.Item >
                </Flex.Item>
              </Flex>
            </WingBlank>

            <WingBlank style={{ marginBottom: 5 }}>
              <Flex>
                <Flex.Item>
                  <TouchableNativeFeedback onPress={this.Close}>
                    <Image source={require('./Images/close.png')} style={{ position: "absolute", left: "50%", width: 28, height: 28 }} />
                  </TouchableNativeFeedback>
                </Flex.Item>
                <Flex.Item >
                </Flex.Item>
                <Flex.Item>
                  <TouchableNativeFeedback onPress={this.Sound}>
                    <Image source={require('./Images/sound.png')} style={{ position: "absolute", right: "50%", width: 24, height: 24 }} />
                  </TouchableNativeFeedback>
                </Flex.Item>
              </Flex>
            </WingBlank>
            <View style={{ height: 30, width: '100%' }}></View>

            <View>
              <Image source={{ uri: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1574920244958&di=7e36a83a31f8f6f0909dbacc08cf6b93&imgtype=0&src=http%3A%2F%2Fpic1.win4000.com%2Fmobile%2Fd%2F597997daa6ca8.jpg' }}
                style={{ position: 'absolute', top: 0 }} height={Dimensions.get('window').height - 260} width={Dimensions.get('window').width} />
              <Surface height={Dimensions.get('window').height - 260} width={Dimensions.get('window').width} >
                <Shape d={path} stroke="yellow" strokeWidth={2} strokeDash={[10,10]} fill="blue"/>

              </Surface>
            </View>

            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={{ height: 25, width: "100%" }}>
                <WingBlank >
                  <Flex>
                    <Flex.Item >
                      <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "bold", fontSize: 20 }}>{this.state.rundistance != "-1" ? this.state.rundistance : "—"}M</Text>
                    </Flex.Item>
                    <Flex.Item ></Flex.Item>
                    <Flex.Item >
                      <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "bold", fontSize: 20 }}>{this.state.power != "-1" ? this.state.power : "—"}%</Text>
                    </Flex.Item>
                    <Flex.Item ></Flex.Item>
                    <Flex.Item >
                      <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "bold", fontSize: 20 }}>{this.state.runtime}min</Text>
                    </Flex.Item>
                  </Flex>
                </WingBlank>
              </View>

              <View style={{ height: 25, width: "100%" }}>
                <WingBlank >
                  <Flex>
                    <Flex.Item >
                      <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>运行距离</Text>
                    </Flex.Item>
                    <Flex.Item ></Flex.Item>
                    <Flex.Item >
                      <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>剩余电量</Text>
                    </Flex.Item>
                    <Flex.Item ></Flex.Item>
                    <Flex.Item >
                      <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "bold", fontSize: 14 }}>运行时间</Text>
                    </Flex.Item>
                  </Flex>
                </WingBlank>
              </View>

              <View style={{ height: 90, width: "100%", backgroundColor: "white" }}>
                <Grid data={data} hasLine={false} columnNum={4} />
              </View>

            </View>

          </Drawer>
        </Provider>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  containerHorizontal: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
