import React from 'react';

class DefaultEditInstructions extends React.Component {

  render() {
    return (
      <div className="card card-outline-primary">
        <div className="card-block">
          <h4 className="card-title">Свободное редактирование</h4>
          <p className="card-text">Отредактируйте любые аннотации, нуждающиеся в корректировке. Используйте курсор для изменения полей. Для изменения точек необходимо перетащить маркеры в области поля. Используйте опции, для активации или деактивации видимости компонента.</p>
          <p className="card-text">Нажмите кнопку `Сохранить` для сохранения итоговых аннотаций, либо нажмите клавишу `s`.</p>
        </div>
      </div>
    );
  }
}

class KeypointInstructions extends React.Component {

  render(){
    return (
      <div className="card card-warning">
        <div className="card-block">
          <h4 className="card-title">Нажмите на <span className="font-italic font-weight-bold">{this.props.name}</span></h4>
          <p className="card-text">Нажмите клавишу `v` для переключения видимости. Нажмите клавишу `esc` для изменения видимости на н/д.</p>
          <p className="card-text">Нажмите кнопку `Сохранить` для сохранения итоговых аннотаций, либо нажмите клавишу `s`.</p>
        </div>
      </div>
    );
  }

}

class BBoxInstructions extends React.Component {

  render(){
    return (
      <div className="card card-warning">
        <div className="card-block">
          <h4 className="card-title">Нажмите и перетащите поле <span className="font-italic font-weight-bold">{this.props.name}</span></h4>
          <p className="card-text">Нажмите клавишу `esc` для отмены.</p>
          <p className="card-text">Нажмите кнопку `Сохранить` для сохранения итоговых аннотаций, либо нажмите клавишу `s`.</p>
        </div>
      </div>
    );
  }

}

export { DefaultEditInstructions, KeypointInstructions, BBoxInstructions }